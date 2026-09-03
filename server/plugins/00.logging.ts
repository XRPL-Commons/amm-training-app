// Production logging runtime: console patch, fatal handlers, startup line, and
// one ERROR line per 5xx response. Ordered `00.` so it runs before every other
// Nitro plugin. Development output (pino-pretty) is left untouched.
// See server/utils/productionLogging.ts.
import { isError } from 'h3'
import { installProductionLogging } from '../utils/productionLogging'
import { createLogger } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  if (process.env.NODE_ENV !== 'production') return
  installProductionLogging()

  const log = createLogger('http')
  nitroApp.hooks.hook('error', (error, { event }) => {
    // 4xx are client mistakes (WARN territory at most); only 5xx page a human.
    const statusCode = isError(error) ? error.statusCode : 500
    if (statusCode < 500) return
    log.error('request failed', {
      method: event?.method ?? 'unknown',
      path: event?.path ?? 'unknown',
      statusCode,
      err: error,
    })
  })
})
