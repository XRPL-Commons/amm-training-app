import { DeleteUser } from '~/server/connectors/memory'
import { requireAdminAuth } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireAdminAuth(event)

  try {
    const address = getRouterParam(event, 'address')

    if (!address) {
      throw createError({
        status: 400,
        statusMessage: 'Address is required'
      })
    }

    const deleted = await DeleteUser(address)

    if (!deleted) {
      throw createError({
        status: 404,
        statusMessage: 'User not found'
      })
    }

    return { deleted: true }
  } catch (error: any) {
    throw createError({
      status: 500,
      statusMessage: 'Failed to delete user'
    })
  }
})
