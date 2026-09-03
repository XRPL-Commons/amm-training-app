import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MAX_LINE_BYTES, TRUNCATED_MARK } from '../server/utils/logLineCap'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = resolve(root, 'tests/fixtures/logging-child.ts')

const RFC3339_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

type Line = Record<string, any>

function run(scenario: string, env: Record<string, string> = {}) {
  const res = spawnSync(process.execPath, ['--import', 'tsx', fixture, scenario], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'production', COMMIT_SHA: 'abc1234', ...env },
  })
  const stdout = res.stdout ?? ''
  const lines = stdout.split('\n').filter((l) => l.length > 0)
  const parsed: Line[] = lines.map((l) => JSON.parse(l))
  return { res, stdout, stderr: res.stderr ?? '', lines, parsed }
}

function assertContract(raw: string, rec: Line) {
  expect(Buffer.byteLength(raw, 'utf8')).toBeLessThanOrEqual(MAX_LINE_BYTES)
  expect(rec.dt).toMatch(RFC3339_UTC)
  expect(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).toContain(rec.level)
  expect(typeof rec.msg).toBe('string')
  expect(rec.msg).not.toMatch(/\n/)
  // eslint-disable-next-line no-control-regex
  expect(rec.msg).not.toMatch(/\x1b\[/)
  expect(rec.service).toBe('amm-training-app')
}

describe('production logging contract (NODE_ENV=production)', () => {
  it('emits exactly one startup line with event=startup, commit and node', () => {
    const { res, lines, parsed, stderr } = run('startup')
    expect(res.status, stderr).toBe(0)
    expect(stderr).toBe('')
    expect(lines).toHaveLength(1)
    assertContract(lines[0], parsed[0])
    expect(parsed[0]).toMatchObject({
      level: 'INFO',
      event: 'startup',
      msg: 'startup',
      commit: 'abc1234',
      node: process.version,
    })
  })

  it('logs an Error with a multi-line stack as one JSON line with err fields', () => {
    const { res, lines, parsed, stderr } = run('contract')
    expect(res.status, stderr).toBe(0)
    expect(lines).toHaveLength(2) // startup + error
    const [raw, rec] = [lines[1], parsed[1]]
    assertContract(raw, rec)
    expect(rec.level).toBe('ERROR')
    expect(rec.msg).toBe('something failed')
    expect(rec.requestId).toBe('abc')
    expect(rec.err).toMatchObject({ name: 'Error', message: 'boom' })
    expect(rec.err.stack).toMatch(/^Error: boom\n\s+at /)
    expect(rec.err.stack.split('\n').length).toBeGreaterThan(2)
  })

  it('caps a 10 KB stack with the marker and the line still parses', () => {
    const { res, lines, parsed, stderr } = run('cap')
    expect(res.status, stderr).toBe(0)
    expect(lines).toHaveLength(2)
    const [raw, rec] = [lines[1], parsed[1]]
    assertContract(raw, rec)
    expect(Buffer.byteLength(raw, 'utf8')).toBeLessThanOrEqual(MAX_LINE_BYTES)
    expect(rec.err.stack.endsWith(TRUNCATED_MARK)).toBe(true)
    expect(rec.err.stack.startsWith('Error: big\n')).toBe(true)
    expect(rec.msg).toBe('huge stack') // msg untouched: stack was enough
    expect(rec.err.message).toBe('big')
  })

  it('lifts a Nitro [request error] string stack into err.stack', () => {
    const { res, lines, parsed, stderr } = run('nitro')
    expect(res.status, stderr).toBe(0)
    expect(stderr).toBe('') // never writes back through the patched console
    expect(lines).toHaveLength(2)
    const [raw, rec] = [lines[1], parsed[1]]
    assertContract(raw, rec)
    expect(rec.level).toBe('ERROR')
    expect(rec.err.stack).toBe('  at fn (file.js:1:2)')
    expect(rec.msg).toBe('[request error] [unhandled] [GET] /x')
    expect(rec.msg).not.toContain('at fn')
  })

  it('maps a console.error Error argument into err', () => {
    const { res, lines, parsed, stderr } = run('console-error-arg')
    expect(res.status, stderr).toBe(0)
    expect(lines).toHaveLength(2)
    const rec = parsed[1]
    assertContract(lines[1], rec)
    expect(rec.level).toBe('ERROR')
    expect(rec.msg).toBe('request failed')
    expect(rec.err).toMatchObject({ name: 'Error', message: 'nope' })
    expect(rec.err.stack).toMatch(/^Error: nope\n/)
  })

  it('maps console levels, strips ANSI and collapses newlines', () => {
    const { res, lines, parsed, stderr } = run('console-levels')
    expect(res.status, stderr).toBe(0)
    expect(lines).toHaveLength(3)
    assertContract(lines[1], parsed[1])
    assertContract(lines[2], parsed[2])
    expect(parsed[1].level).toBe('INFO')
    expect(parsed[1].msg).toBe('hello green world second line')
    expect(parsed[2].level).toBe('WARN')
    expect(parsed[2].msg).toContain('careful')
  })

  it('redacts secrets passed through the facade', () => {
    const { res, lines, parsed, stderr } = run('redact')
    expect(res.status, stderr).toBe(0)
    expect(lines).toHaveLength(2)
    assertContract(lines[1], parsed[1])
    expect(parsed[1].level).toBe('WARN')
    expect(parsed[1].ok).toBe(true)
    expect(parsed[1].token).toBe('[Redacted]')
    expect(parsed[1].nested.password).toBe('[Redacted]')
    expect(lines[1]).not.toContain('secret-token')
    expect(lines[1]).not.toContain('hunter2')
  })

  it('an unhandled rejection yields one FATAL line and exit code 1', () => {
    const { res, lines, parsed } = run('fatal')
    expect(res.status).toBe(1)
    expect(lines).toHaveLength(2)
    const [raw, rec] = [lines[1], parsed[1]]
    assertContract(raw, rec)
    expect(rec).toMatchObject({ level: 'FATAL', event: 'fatal', msg: 'unhandledRejection' })
    expect(rec.err).toMatchObject({ name: 'Error', message: 'rejected' })
    expect(parsed.filter((l) => l.level === 'FATAL')).toHaveLength(1)
  })

  it('an uncaught exception yields one FATAL line and exit code 1', () => {
    const { res, lines, parsed } = run('fatal-exception')
    expect(res.status).toBe(1)
    expect(lines).toHaveLength(2)
    assertContract(lines[1], parsed[1])
    expect(parsed[1]).toMatchObject({ level: 'FATAL', event: 'fatal', msg: 'uncaughtException' })
    expect(parsed[1].err).toMatchObject({ name: 'Error', message: 'thrown' })
  })
})
