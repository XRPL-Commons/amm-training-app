import { createLogger } from '../utils/logger'

const log = createLogger('http')

export default defineEventHandler(async (event) => {
  // Per-request chatter is DEBUG (hidden by default in production); no sensitive data.
  log.debug(`${event.method} ${getRequestURL(event).pathname}`, {
    method: event.method,
    path: getRequestURL(event).pathname,
  })
})
