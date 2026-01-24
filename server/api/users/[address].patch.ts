import { UpdateUser } from '~/server/connectors/memory'
import { requireAdminAuth } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireAdminAuth(event)

  try {
    const address = getRouterParam(event, 'address')
    const body = await readBody(event)

    if (!address) {
      throw createError({
        status: 400,
        statusMessage: 'Address is required'
      })
    }

    const updated = await UpdateUser(address, { name: body.name })

    if (!updated) {
      throw createError({
        status: 404,
        statusMessage: 'User not found'
      })
    }

    return updated
  } catch (error: any) {
    if (error.message === 'Name already taken') {
      throw createError({
        status: 409,
        statusMessage: 'Name already taken'
      })
    }
    throw createError({
      status: 500,
      statusMessage: 'Failed to update user'
    })
  }
})
