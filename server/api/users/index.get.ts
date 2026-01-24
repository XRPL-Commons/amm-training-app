import { GetUsers } from '~/server/connectors/memory'

const getUsers = async () => {
  // list existing users
  let users = await GetUsers();
  return users;
}

export default defineEventHandler(async (event) => {
  try {    
    return getUsers()
  } catch (e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch users'
    })
  }
})
