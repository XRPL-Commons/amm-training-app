/**
 * Child-process fixture for the production logging contract tests.
 * Run with NODE_ENV=production; prints JSON lines to stdout. Scenario in argv[2].
 */
import { installProductionLogging } from '../../server/utils/productionLogging'
import { logger } from '../../server/utils/logger'

const scenario = process.argv[2]

// Emits the startup line, patches console, installs fatal handlers.
installProductionLogging()

switch (scenario) {
  case 'startup':
    break
  case 'contract': {
    const err = new Error('boom')
    logger.error('something failed', { err, requestId: 'abc' })
    break
  }
  case 'cap': {
    const err = new Error('big')
    // ~10 KB stack
    err.stack =
      'Error: big\n' +
      Array.from({ length: 200 }, (_, i) => `    at fn${i} (/app/src/module/file${i}.js:${i}:${i})`).join('\n')
    logger.error('huge stack', { err })
    break
  }
  case 'nitro':
    console.error('[request error] [unhandled] [GET] /x\n  at fn (file.js:1:2)')
    break
  case 'console-error-arg':
    console.error('request failed', new Error('nope'))
    break
  case 'console-levels':
    console.log('hello \x1b[32mgreen\x1b[0m world\nsecond line')
    console.warn('careful', { token: 'secret-token', ok: true })
    break
  case 'redact':
    logger.warn('careful', { token: 'secret-token', nested: { password: 'hunter2' }, ok: true })
    break
  case 'fatal':
    // Unhandled rejection -> FATAL line, flush, exit(1).
    void Promise.reject(new Error('rejected'))
    break
  case 'fatal-exception':
    setTimeout(() => {
      throw new Error('thrown')
    }, 0)
    break
  default:
    throw new Error(`unknown scenario: ${scenario}`)
}
