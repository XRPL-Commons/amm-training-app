import type { UserObject } from '~/src/types'
import API from '~/server/client'

const users = ref<UserObject[]>([])
const loading = ref(false)

export function useUsers() {
  async function fetchUsers() {
    loading.value = true
    try {
      users.value = await API.listUsers({})
    } finally {
      loading.value = false
    }
  }

  async function refreshStats() {
    loading.value = true
    try {
      const result = await API.refreshUserStats({})
      users.value = result.users
    } finally {
      loading.value = false
    }
  }

  async function refreshUserStats(xrplAddress: string) {
    try {
      const stats = await API.getUserStats({ address: xrplAddress })
      // Update user in local state
      users.value = users.value.map(u =>
        u.xrplAddress === xrplAddress
          ? { ...u, tokenCount: stats.tokenCount, poolCount: stats.poolCount }
          : u
      )
      return stats
    } catch {
      return null
    }
  }

  function addUserOptimistic(user: UserObject) {
    users.value = [...users.value, { ...user, tokenCount: 0, poolCount: 0 }]
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
    refreshStats,
    refreshUserStats,
    addUserOptimistic,
    removeUserOptimistic,
    updateUserOptimistic,
    findUser
  }
}
