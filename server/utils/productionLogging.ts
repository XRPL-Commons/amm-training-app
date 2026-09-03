/**
 * Production-only logging runtime, installed by server/plugins/00.logging.ts.
 *
 * - Console patch: `console.log/info/debug/warn/error` go through the Pino facade
 *   at the mapped level, so anything not yet migrated (and Nitro's own
 *   `[request error]` output) still lands as one JSON line.
 * - Fatal handlers: uncaught exceptions / unhandled rejections log
 *   `level=FATAL event=fatal`, flush, then exit(1).
 * - Startup line: `event=startup` with commit + node version.
 *
 * Kept free of Nitro globals so it can be unit-tested under vitest.
 */
import { format } from 'node:util'
import { logger, flushLogs, sanitizeMessage, serializeError } from './logger'
import type { Logger } from './logger'

type ConsoleMethod = 'log' | 'info' | 'debug' | 'warn' | 'error'
type FacadeLevel = 'info' | 'debug' | 'warn' | 'error'

const CONSOLE_LEVEL: Record<ConsoleMethod, FacadeLevel> = {
  log: 'info',
  info: 'info',
  debug: 'debug',
  warn: 'warn',
  error: 'error',
}

/**
 * A "real" stack frame: `at <something>` ending in `:line:col` (optionally `)`).
 * Only such lines trigger stack lifting; prose lines never do.
 */
const FRAME_RE = /^\s*at\s.+:\d+:\d+\)?\s*$/

export interface ParsedConsoleArgs {
  msg: string
  err?: Record<string, unknown>
}

/**
 * Turn `console.*` arguments into `{ msg, err }`:
 * - the first `Error` argument becomes `err`;
 * - otherwise, if the joined text contains stack frames (Nitro's
 *   `[request error] ... \n  at fn (file.js:1:2)` format), the frames are lifted
 *   into `err.stack` and removed from `msg`;
 * - the rest is `util.format`-joined, ANSI-stripped and newline-collapsed.
 */
export function parseConsoleArgs(args: unknown[]): ParsedConsoleArgs {
  let err: Record<string, unknown> | undefined
  const rest: unknown[] = []
  for (const arg of args) {
    if (!err && arg instanceof Error) err = serializeError(arg)
    else rest.push(arg)
  }
  let text = rest.length ? format(...rest) : ''

  if (!err) {
    const lines = text.split(/\r?\n/)
    const firstFrame = lines.findIndex((line) => FRAME_RE.test(line))
    if (firstFrame !== -1) {
      const stack = lines.slice(firstFrame).map((l) => l.replace(/\s+$/, '')).join('\n')
      text = lines.slice(0, firstFrame).join('\n')
      const message = sanitizeMessage(text).trim()
      err = { name: 'Error', message, stack }
    }
  }

  const msg = sanitizeMessage(text).trim()
  return err ? { msg: msg || String(err.message ?? ''), err } : { msg }
}

const PATCHED = Symbol.for('amm-training-app.console-patched')

/**
 * Route console output through the facade. Never writes back through the
 * patched console: the facade's destination is a raw fd-1 stream.
 */
export function patchConsole(target: Logger = logger, con: Console = console): void {
  const c = con as Console & { [PATCHED]?: boolean }
  if (c[PATCHED]) return
  for (const method of Object.keys(CONSOLE_LEVEL) as ConsoleMethod[]) {
    const level = CONSOLE_LEVEL[method]
    c[method] = (...args: unknown[]) => {
      const { msg, err } = parseConsoleArgs(args)
      target[level](msg, err ? { err } : undefined)
    }
  }
  c[PATCHED] = true
}

const FATAL_EXIT_BACKSTOP_MS = 250

function handleFatal(target: Logger, kind: 'uncaughtException' | 'unhandledRejection', reason: unknown): void {
  const err = reason instanceof Error ? reason : new Error(String(reason))
  target.fatal(kind, { event: 'fatal', err })
  // Exit from the flush callback; if flushing hangs, the unref'd backstop fires.
  const backstop = setTimeout(() => process.exit(1), FATAL_EXIT_BACKSTOP_MS)
  backstop.unref()
  flushLogs(() => process.exit(1))
}

export function installFatalHandlers(target: Logger = logger, proc: NodeJS.Process = process): void {
  proc.on('uncaughtException', (error) => handleFatal(target, 'uncaughtException', error))
  proc.on('unhandledRejection', (reason) => handleFatal(target, 'unhandledRejection', reason))
}

export function logStartup(target: Logger = logger): void {
  target.info('startup', {
    event: 'startup',
    commit: process.env.COMMIT_SHA || 'unknown',
    node: process.version,
  })
}

const INSTALLED = Symbol.for('amm-training-app.production-logging-installed')

/** Install everything, once per process. */
export function installProductionLogging(): void {
  const g = globalThis as typeof globalThis & { [INSTALLED]?: boolean }
  if (g[INSTALLED]) return
  g[INSTALLED] = true
  patchConsole()
  installFatalHandlers()
  logStartup()
}
