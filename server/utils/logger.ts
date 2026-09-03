/**
 * Logging facade (fleet standard; copied from XRPL-Commons/pulse and adapted).
 *
 * - Development (`NODE_ENV=development`): pino-pretty, coloured, multi-line.
 * - Otherwise: one JSON line per event on stdout, `dt` timestamp, uppercase
 *   `level`, `service` tag, redacted secrets, bounded to 1900 bytes per line
 *   (see ./logLineCap). This is the contract Better Stack + fleet alerts rely on.
 *
 * Usage:
 *   logger.info('user created', { xrplAddress })
 *   createLogger('store').error('failed to persist', { err })
 */
import pino from 'pino'
import pinoPretty from 'pino-pretty'
import { createCappedDestination } from './logLineCap'

export const SERVICE_NAME = 'amm-training-app'

type LogData = Record<string, unknown>
type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug'

const isDev = process.env.NODE_ENV === 'development'

const VALID_LEVELS = new Set(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
function resolveLevel(): string {
  const raw = (process.env.LOG_LEVEL || '').toLowerCase()
  return VALID_LEVELS.has(raw) ? raw : 'info'
}

const MODULE_COLORS = [
  '\x1b[38;5;39m', // blue
  '\x1b[38;5;208m', // orange
  '\x1b[38;5;141m', // purple
  '\x1b[38;5;42m', // green
  '\x1b[38;5;213m', // pink
  '\x1b[38;5;220m', // gold
  '\x1b[38;5;51m', // cyan
  '\x1b[38;5;203m', // coral
]

function colorFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return MODULE_COLORS[hash % MODULE_COLORS.length]!
}

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g

/** Production `msg` hygiene: no ANSI, no newlines (one record per line). */
export function sanitizeMessage(message: unknown): string {
  const s = typeof message === 'string' ? message : String(message)
  return s.replace(ANSI_RE, '').replace(/[ \t]*\r?\n[ \t]*/g, ' ')
}

const prettyStream = isDev
  ? pinoPretty({
      colorize: true,
      levelFirst: false,
      translateTime: 'SYS:standard',
      timestampKey: 'dt',
      messageFormat: (log, messageKey) => {
        const parts: string[] = []
        if (log.module) {
          const name = String(log.module)
          parts.push(`${colorFor(name)}[${name}]\x1b[0m`)
        }
        const msg = log[messageKey]
        if (msg != null) parts.push(String(msg))
        return parts.join(' ')
      },
      ignore: 'pid,hostname,module,service',
      errorLikeObjectKeys: ['err', 'error'],
      errorProps: '',
    })
  : undefined

// Synchronous stdout destination (fd 1, never through `console`), line-capped.
const productionStream = isDev
  ? undefined
  : createCappedDestination(pino.destination({ fd: 1, sync: true }))

const pinoLogger = pino(
  {
    level: resolveLevel(),
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
    // RFC 3339 UTC timestamp under `dt` (Better Stack reads it as event time).
    timestamp: () => `,"dt":"${new Date().toISOString()}"`,
    messageKey: 'msg',
    base: { service: SERVICE_NAME },
    // The facade already serializes `err` into the contract shape; Pino's default
    // err serializer would otherwise re-shape it (adds `type`, reorders keys).
    serializers: { err: (value: unknown) => value },
    redact: {
      paths: [
        'password',
        'token',
        'jwt',
        'accessToken',
        'refreshToken',
        '*.password',
        '*.token',
        '*.jwt',
        '*.accessToken',
        '*.refreshToken',
        '*.*.password',
        '*.*.token',
        '*.*.jwt',
        '*.*.accessToken',
        '*.*.refreshToken',
        'req.headers.authorization',
        'req.headers.cookie',
        'headers.authorization',
        'headers.cookie',
        '*.headers.authorization',
        '*.headers.cookie',
        '*.*.headers.authorization',
        '*.*.headers.cookie',
        '*.config.headers.authorization',
        '*.config.headers.cookie',
        '*.request.headers.authorization',
        '*.request.headers.cookie',
      ],
      censor: '[Redacted]',
    },
  },
  // In dev: pretty stream. In prod: capped stdout. (pino requires a stream or nothing.)
  (prettyStream ?? productionStream) as pino.DestinationStream,
)

const MAX_CAUSE_DEPTH = 3

export function serializeError(err: unknown, depth = 0): Record<string, unknown> {
  if (err instanceof Error) {
    const out: Record<string, unknown> = {
      ...Object.fromEntries(Object.entries(err)),
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
    const cause = (err as { cause?: unknown }).cause
    if (cause !== undefined) {
      out.cause = depth < MAX_CAUSE_DEPTH ? serializeError(cause, depth + 1) : '[nested cause omitted]'
    }
    return out
  }
  if (typeof err === 'object' && err !== null) {
    return JSON.parse(
      JSON.stringify(err, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    )
  }
  return { message: String(err) }
}

function log(target: pino.Logger, level: LogLevel, message: string, data?: unknown): void {
  const logData: LogData = { msg: isDev ? message : sanitizeMessage(message) }
  if (data instanceof Error) {
    logData.err = serializeError(data)
  } else if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // `err` always takes the contract shape ({ name, message, stack, cause? }),
      // even when a non-Error value was thrown.
      logData[key] = value instanceof Error || (key === 'err' && value !== undefined)
        ? serializeError(value)
        : value
    }
  } else if (data !== undefined) {
    logData.data = data
  }
  target[level](logData)
}

export interface Logger {
  fatal: (message: string, data?: LogData | unknown) => void
  error: (message: string, data?: LogData | unknown) => void
  warn: (message: string, data?: LogData | unknown) => void
  info: (message: string, data?: LogData | unknown) => void
  debug: (message: string, data?: LogData | unknown) => void
  child: (bindings: Record<string, unknown>) => Logger
}

function makeFacade(target: pino.Logger): Logger {
  return {
    fatal: (message, data) => log(target, 'fatal', message, data),
    error: (message, data) => log(target, 'error', message, data),
    warn: (message, data) => log(target, 'warn', message, data),
    info: (message, data) => log(target, 'info', message, data),
    debug: (message, data) => log(target, 'debug', message, data),
    child: (bindings) => makeFacade(target.child(bindings)),
  }
}

export const logger: Logger = makeFacade(pinoLogger)

export const createLogger = (module: string, bindings?: Record<string, unknown>): Logger =>
  logger.child({ module, ...bindings })

/** Drain buffered log output; used by the fatal handlers before exiting. */
export function flushLogs(cb: (err?: Error | null) => void): void {
  pinoLogger.flush(cb)
}
