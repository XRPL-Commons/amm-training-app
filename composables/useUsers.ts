import type { UserObject } from '~/src/types'
import API from '~/server/client'

const users = ref<UserObject[]>([])
const loading = ref(false)

export function useUsers() {
  async function fetchUsers() {
    loading.value = true
    try {
      users.value = await API.getUsers({})
    } finally {
      loading.value = false
    }
  }

  function addUserOptimistic(user: UserObject) {
    // Add optimistically at the end
    users.value = [...users.value, user]
  }

  function removeUserOptimistic(xrplAddress: string) {
    users.value = users.value.filter(u => u.xrplAddress !== xrplAddress)
  }

  function updateUserOptimistic(xrplAddress: string, updates: Partial<UserObject>) {
    users.value = users.value.map(u =>
      u.xrplAddress === xrplAddress ? { ...u, ...updates } : u
    )
  }

  function findUser(xrplAddress: string) {
    return users.value.find(u => u.xrplAddress === xrplAddress)
  }

  return {
    users,
    loading,
    fetchUsers,
    addUserOptimistic,
    removeUserOptimistic,
    updateUserOptimistic,
    findUser
  }
}
