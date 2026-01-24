export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!config.adminPassword) {
    // No password configured, allow access
    return { valid: true }
  }

  if (body.password === config.adminPassword) {
    return { valid: true }
  }

  throw createError({
    status: 401,
    statusMessage: 'Invalid password'
  })
})
