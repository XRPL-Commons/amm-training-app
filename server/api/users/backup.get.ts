import { GetUsers } from '~/server/connectors/memory'

export default defineEventHandler(async (event) => {
  try {
    const users = await GetUsers()
    return {
      exportedAt: new Date().toISOString(),
      users
    }
  } catch (e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to export users'
    })
  }
})
