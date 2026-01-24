import type { H3Event } from 'h3'

export async function requireAdminAuth(event: H3Event) {
  const config = useRuntimeConfig()

  // If no password configured, allow access
  if (!config.adminPassword) {
    return true
  }

  // Check header for admin password
  const adminPassword = getHeader(event, 'x-admin-password')

  if (adminPassword !== config.adminPassword) {
    throw createError({
      status: 401,
      statusMessage: 'Admin authentication required'
    })
  }

  return true
}
