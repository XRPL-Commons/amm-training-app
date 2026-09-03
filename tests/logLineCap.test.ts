import { describe, expect, it } from 'vitest'
import { capLine, capRecord, MAX_LINE_BYTES, TRUNCATED_MARK } from '../server/utils/logLineCap'

const bytes = (s: string) => Buffer.byteLength(s, 'utf8')
const base = { dt: '2026-09-03T00:00:00.000Z', level: 'ERROR', service: 'amm-training-app' }
const big = (n: number, ch = 'x') => ch.repeat(n)

describe('capLine', () => {
  it('returns short lines untouched', () => {
    const line = JSON.stringify({ ...base, msg: 'hi' }) + '\n'
    expect(capLine(line)).toBe(line)
  })

  it('truncates err.stack first and leaves msg alone', () => {
    const line = JSON.stringify({ ...base, msg: 'm', err: { name: 'Error', message: 'x', stack: big(10_000) } }) + '\n'
    const out = capLine(line)
    expect(bytes(out)).toBeLessThanOrEqual(MAX_LINE_BYTES)
    expect(out.endsWith('\n')).toBe(true)
    const rec = JSON.parse(out)
    expect(rec.msg).toBe('m')
    expect(rec.err.stack.endsWith(TRUNCATED_MARK)).toBe(true)
    expect(rec.err.message).toBe('x')
  })

  it('then truncates err.cause, then msg', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = capRecord({
      ...base,
      msg: big(3000, 'm'),
      err: { name: 'E', message: 'x', stack: big(3000, 's'), cause: { name: 'C', message: 'c', stack: big(3000, 'c') } },
    })
    const out = JSON.stringify(rec) + '\n'
    expect(bytes(out)).toBeLessThanOrEqual(MAX_LINE_BYTES)
    expect(rec.err.stack).toBe(TRUNCATED_MARK)
    expect(rec.err.cause.stack).toBe(TRUNCATED_MARK)
    expect(rec.msg.endsWith(TRUNCATED_MARK)).toBe(true)
    expect(rec.msg.startsWith('mmm')).toBe(true)
  })

  it('bounds the encoded bytes, not characters (multi-byte msg)', () => {
    const line = JSON.stringify({ ...base, msg: big(1500, 'é') }) + '\n' // 3000+ bytes
    const out = capLine(line)
    expect(bytes(out)).toBeLessThanOrEqual(MAX_LINE_BYTES)
    expect(JSON.parse(out).msg.endsWith(TRUNCATED_MARK)).toBe(true)
  })

  it('falls back to contract fields when a context object is huge', () => {
    const line = JSON.stringify({ ...base, msg: 'm', module: 'store', ctx: big(5000) }) + '\n'
    const out = capLine(line)
    expect(bytes(out)).toBeLessThanOrEqual(MAX_LINE_BYTES)
    const rec = JSON.parse(out)
    expect(rec).toMatchObject({ ...base, msg: 'm', module: 'store', truncated: true })
    expect(rec.ctx).toBeUndefined()
  })

  it('hard-cuts a non-JSON oversized line but keeps the bound', () => {
    const out = capLine(big(5000) + '\n')
    expect(bytes(out)).toBeLessThanOrEqual(MAX_LINE_BYTES)
    expect(out.endsWith(TRUNCATED_MARK + '\n')).toBe(true)
  })
})
