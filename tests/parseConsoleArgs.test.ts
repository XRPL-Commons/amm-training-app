import { describe, expect, it } from 'vitest'
import { parseConsoleArgs, patchConsole } from '../server/utils/productionLogging'
import type { Logger } from '../server/utils/logger'

describe('parseConsoleArgs', () => {
  it('uses the first Error argument as err and joins the rest into msg', () => {
    const e = new Error('nope')
    const { msg, err } = parseConsoleArgs(['failed', e, 'after'])
    expect(msg).toBe('failed after')
    expect(err).toMatchObject({ name: 'Error', message: 'nope' })
    expect(err!.stack).toBe(e.stack)
  })

  it('lifts a Nitro-style string stack into err.stack', () => {
    const { msg, err } = parseConsoleArgs([
      '[request error] [unhandled] [GET] /x\n  at fn (file.js:1:2)\n  at other (/a/b.mjs:10:20)',
    ])
    expect(msg).toBe('[request error] [unhandled] [GET] /x')
    expect(err!.stack).toBe('  at fn (file.js:1:2)\n  at other (/a/b.mjs:10:20)')
    expect(err!.name).toBe('Error')
    expect(err!.message).toBe('[request error] [unhandled] [GET] /x')
  })

  it('does not lift prose that merely contains "at" without :line:col', () => {
    const { msg, err } = parseConsoleArgs(['meeting\n  at noon in room 4'])
    expect(err).toBeUndefined()
    expect(msg).toBe('meeting at noon in room 4')
  })

  it('strips ANSI and collapses newlines; formats non-string args', () => {
    const { msg, err } = parseConsoleArgs(['\x1b[31mred\x1b[0m', 42, { a: 1 }])
    expect(err).toBeUndefined()
    expect(msg).toBe('red 42 { a: 1 }')
  })
})

describe('patchConsole', () => {
  it('routes console methods to the mapped facade level, once', () => {
    const calls: Array<[string, string, unknown]> = []
    const fake = {} as Logger
    for (const level of ['fatal', 'error', 'warn', 'info', 'debug'] as const) {
      fake[level] = (m: string, d?: unknown) => calls.push([level, m, d])
    }
    fake.child = () => fake
    const con = { log() {}, info() {}, debug() {}, warn() {}, error() {} } as unknown as Console
    patchConsole(fake, con)
    const patched = con.error
    patchConsole(fake, con) // idempotent
    expect(con.error).toBe(patched)

    con.log('a')
    con.info('b')
    con.debug('c')
    con.warn('d')
    con.error('e', new Error('x'))
    expect(calls.map(([l, m]) => [l, m])).toEqual([
      ['info', 'a'],
      ['info', 'b'],
      ['debug', 'c'],
      ['warn', 'd'],
      ['error', 'e'],
    ])
    expect((calls[4][2] as any).err.message).toBe('x')
  })
})
