export default defineEventHandler(async (event) => {
  // Basic request logging without sensitive data
  console.log(`${event.method} ${getRequestURL(event).pathname}`)
})
