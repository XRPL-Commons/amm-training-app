import { GetUsers } from '~/server/connectors/memory'
import { requireAdminAuth } from '~/server/utils/adminAuth'

const getUsers = async () => {
  // list existing users
  let users = await GetUsers();
  return users;
}

export default defineEventHandler(async (event) => {
  await requireAdminAuth(event)

  try {
    return getUsers()
  } catch (e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch users'
    })
  }
})
