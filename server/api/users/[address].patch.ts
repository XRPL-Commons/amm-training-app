import { UpdateUser } from '~/server/connectors/memory'

export default defineEventHandler(async (event) => {
  try {
    const address = getRouterParam(event, 'address')
    const body = await readBody(event)

    if (!address) {
      throw createError({
        status: 400,
        statusMessage: 'Address is required'
      })
    }

    const updated = await UpdateUser(address, {
      name: body.name,
      tokenCurrency: body.tokenCurrency,
      tokenIssuer: body.tokenIssuer,
      ammAccount: body.ammAccount
    })

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
    if (error.statusCode) throw error
    throw createError({
      status: 500,
      statusMessage: 'Failed to update user'
    })
  }
})
