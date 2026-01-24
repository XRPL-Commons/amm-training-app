import { clearMemory, AddUser } from '~/server/connectors/memory'
import type { User } from '~/server/connectors/memory'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.users || !Array.isArray(body.users)) {
      throw createError({
        status: 400,
        statusMessage: 'Invalid backup format: users array required'
      })
    }

    clearMemory()

    for (const user of body.users as User[]) {
      if (user.xrplAddress && user.name && user.createdAt) {
        await AddUser(user)
      }
    }

    return { restored: body.users.length }
  } catch (e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to restore users'
    })
  }
})
