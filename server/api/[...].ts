export default defineEventHandler((event) => {
  const routePath = getRequestURL(event)
  throw createError({
    status: 404,
    statusMessage: `Route not found: ${routePath}`
  })
})