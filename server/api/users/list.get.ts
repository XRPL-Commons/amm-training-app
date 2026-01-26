import { GetUsers } from '~/server/connectors/memory'

// Public endpoint to list users (no admin auth required)
// Returns user list for display in training page and other public views

export default defineEventHandler(async () => {
  try {
    const users = await GetUsers()
    return users
  } catch (e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch users'
    })
  }
})
