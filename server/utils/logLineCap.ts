/**
 * Line cap for production JSON logs.
 *
 * Better Stack ingests one record per stdout line, 2000 bytes max. We bound every
 * encoded line to MAX_LINE_BYTES (1900, leaving headroom for the transport) by
 * truncating, in order, `err.stack`, then `err.cause`, then `msg`, each marked with
 * TRUNCATED_MARK, until the whole encoded line fits. The bound applies to the
 * encoded line, not to per-field character counts.
 */

export const MAX_LINE_BYTES = 1900
export const TRUNCATED_MARK = '…[truncated]'

type Rec = Record<string, unknown>

const byteLength = (s: string): number => Buffer.byteLength(s, 'utf8')
const encode = (rec: Rec): string => JSON.stringify(rec) + '\n'

/**
 * Shrink a string field so that the encoded record fits. Works on the encoded
 * byte length (multi-byte chars and JSON escapes included), so it loops: cut the
 * overshoot, re-encode, repeat. Returns the fitted string or `null` when even an
 * empty field + marker does not fit (caller moves on to the next field).
 */
function shrinkString(rec: Rec, get: () => unknown, set: (v: string) => void): boolean {
  const original = get()
  if (typeof original !== 'string' || original.length === 0) return false
  let value = original
  // Guard: if the field already ends with the marker, work on the part before it.
  if (value.endsWith(TRUNCATED_MARK)) value = value.slice(0, -TRUNCATED_MARK.length)
  for (let i = 0; i < 64; i++) {
    const over = byteLength(encode(rec)) - MAX_LINE_BYTES
    if (over <= 0) return true
    if (value.length === 0) return false
    // A char is at least one byte; JSON escapes only grow. Cutting `over` chars is
    // therefore always enough for ASCII and never too little; loop covers the rest.
    const cut = Math.min(value.length, over + (i === 0 ? byteLength(TRUNCATED_MARK) : 0))
    value = value.slice(0, Math.max(0, value.length - cut))
    set(value + TRUNCATED_MARK)
  }
  return byteLength(encode(rec)) <= MAX_LINE_BYTES
}

function fits(rec: Rec): boolean {
  return byteLength(encode(rec)) <= MAX_LINE_BYTES
}

/**
 * Apply the truncation policy to a parsed record. Mutates and returns it.
 */
export function capRecord(rec: Rec): Rec {
  if (fits(rec)) return rec
  const originalMsg = typeof rec.msg === 'string' ? rec.msg : ''
  const err = rec.err
  if (err && typeof err === 'object') {
    const e = err as Rec
    // 1. err.stack
    if (typeof e.stack === 'string') {
      shrinkString(rec, () => e.stack, (v) => { e.stack = v })
      if (fits(rec)) return rec
    }
    // 2. err.cause (a nested serialized error, or a plain value)
    if (e.cause !== undefined) {
      const cause = e.cause
      if (cause && typeof cause === 'object') {
        const c = cause as Rec
        if (typeof c.stack === 'string') {
          shrinkString(rec, () => c.stack, (v) => { c.stack = v })
          if (fits(rec)) return rec
        }
        if (typeof c.message === 'string') {
          shrinkString(rec, () => c.message, (v) => { c.message = v })
          if (fits(rec)) return rec
        }
      } else if (typeof cause === 'string') {
        shrinkString(rec, () => e.cause, (v) => { e.cause = v })
        if (fits(rec)) return rec
      } else {
        e.cause = TRUNCATED_MARK
        if (fits(rec)) return rec
      }
    }
  }
  // 3. msg
  if (typeof rec.msg === 'string') {
    shrinkString(rec, () => rec.msg, (v) => { rec.msg = v })
    if (fits(rec)) return rec
  }
  // Last resort: something else in the record is huge (a giant context object).
  // Keep the contract fields only so the line is still bounded and matchable.
  const minimal: Rec = {}
  for (const key of ['dt', 'level', 'service', 'module', 'event']) {
    if (rec[key] !== undefined) minimal[key] = rec[key]
  }
  minimal.msg = originalMsg
  if (err && typeof err === 'object') {
    const e = err as Rec
    minimal.err = { name: e.name, message: e.message }
  }
  minimal.truncated = true
  if (!fits(minimal)) {
    shrinkString(minimal, () => minimal.msg, (v) => { minimal.msg = v })
    const me = minimal.err as Rec | undefined
    if (!fits(minimal) && me && typeof me.message === 'string') {
      shrinkString(minimal, () => me.message, (v) => { me.message = v })
    }
  }
  return minimal
}

/**
 * Cap one encoded line (JSON + trailing newline). Lines within the budget are
 * returned untouched (no parse cost). Lines that do not parse as JSON are cut
 * hard so the byte bound still holds.
 */
export function capLine(line: string): string {
  if (byteLength(line) <= MAX_LINE_BYTES) return line
  let rec: Rec
  try {
    rec = JSON.parse(line) as Rec
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) throw new Error('not an object')
  } catch {
    const raw = line.replace(/\r?\n/g, ' ')
    let cut = raw
    while (byteLength(cut + TRUNCATED_MARK + '\n') > MAX_LINE_BYTES) cut = cut.slice(0, -Math.max(1, Math.ceil(cut.length / 10)))
    return cut + TRUNCATED_MARK + '\n'
  }
  return encode(capRecord(rec))
}

/* eslint-disable @typescript-eslint/no-explicit-any -- structural match for SonicBoom / any stream */
export interface DestinationLike {
  write: (line: string) => unknown
  flush?: (cb?: (err?: Error | null) => void) => void
  flushSync?: () => void
  end?: (...args: any[]) => unknown
  on?: (...args: any[]) => unknown
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Wrap a Pino destination so every line passes through `capLine`. Forwards
 * flush/flushSync/end/on so Pino's `flush()` and fatal-path draining keep working.
 */
export function createCappedDestination(inner: DestinationLike): DestinationLike {
  return {
    write: (line: string) => inner.write(capLine(line)),
    flush: (cb) => {
      if (typeof inner.flush === 'function') inner.flush(cb)
      else cb?.()
    },
    flushSync: () => inner.flushSync?.(),
    end: (...args) => inner.end?.(...args),
    on: (...args) => inner.on?.(...args),
  }
}
