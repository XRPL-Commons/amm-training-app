<template>
  <div class="w-full max-w-4xl mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-title text-black dark:text-white">Current Session</h1>
      <!-- Join button if connected but not registered -->
      <UButton
        v-if="isConnected && !currentUser && usersLoaded"
        color="primary"
        @click="joinTraining"
        icon="i-heroicons-user-plus"
      >
        Join Session
      </UButton>
    </div>

    <!-- Participants -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Participants</span>
            <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
              {{ users.length }}
            </span>
          </div>
          <UTooltip text="Refresh stats">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-path"
              size="xs"
              :loading="loading"
              @click="refreshStats"
            />
          </UTooltip>
        </div>
      </div>

      <div v-if="users.length === 0" class="p-8 text-center text-gray-500">
        No participants yet. Be the first to join!
      </div>

      <UTable
        v-else
        :rows="users"
        :columns="columns"
        :sort="sort"
        @update:sort="sort = $event"
        :ui="{ tr: { base: 'cursor-pointer' } }"
        @select="openUserDetails"
      >
        <template #name-data="{ row }">
          <span class="font-medium">{{ row.name }}</span>
        </template>
        <template #xrplAddress-data="{ row }">
          <ColoredAddress :address="row.xrplAddress" variant="boxes" />
        </template>
        <template #tokenCount-data="{ row }">
          <span class="text-gray-500">{{ row.tokenCount ?? '-' }}</span>
        </template>
        <template #poolCount-data="{ row }">
          <span class="text-gray-500">{{ row.poolCount ?? '-' }}</span>
        </template>
      </UTable>
    </div>

    <!-- User Details Slideover -->
    <AdminUserSlideover
      v-model="showUserSlideover"
      :user="selectedUser"
      @viewAmm="openAmmDetails"
    />

    <!-- AMM Details Slideover -->
    <AdminAmmSlideover
      v-model="showAmmSlideover"
      :token="selectedToken"
      @viewUser="openUserDetailsByAddress"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { UserObject } from '~/src/types'
import { JoinTrainingModal } from '#components'

const route = useRoute()
const router = useRouter()
const modal = useModal()

// Wallet (from composable)
const { isConnected, xrplAddress, currentUser: walletUser, loadFromStorage, connectWallet, setCurrentUser } = useWallet()

// Users (from composable)
const { users, loading, fetchUsers, refreshStats, refreshUserStats, findUser } = useUsers()

// Table columns and sorting
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'xrplAddress', label: 'Address' },
  { key: 'tokenCount', label: 'Tokens', sortable: true },
  { key: 'poolCount', label: 'Pools', sortable: true }
]
const sort = ref({ column: 'name', direction: 'asc' as const })

// Computed: current user (if registered)
const currentUser = computed(() => {
  if (!xrplAddress.value) return null
  return findUser(xrplAddress.value)
})

// Sync current user to wallet composable
watch(currentUser, (user) => {
  setCurrentUser(user)
}, { immediate: true })

// Slideover state
const showUserSlideover = ref(false)
const showAmmSlideover = ref(false)
const selectedUser = ref<UserObject | null>(null)
const selectedToken = ref<{ currency: string; issuer: string; amount: string } | null>(null)

// Keep selectedUser in sync with users array when stats are refreshed
watch(users, (newUsers) => {
  if (selectedUser.value) {
    const updated = newUsers.find(u => u.xrplAddress === selectedUser.value?.xrplAddress)
    if (updated) {
      selectedUser.value = updated
    }
  }
}, { deep: true })

// Watch URL query changes to open slideovers
watch(() => route.query, async (query) => {
  if (query.user && typeof query.user === 'string') {
    // Only update if different user
    if (selectedUser.value?.xrplAddress !== query.user) {
      const user = users.value.find(u => u.xrplAddress === query.user)
      if (user) {
        selectedUser.value = user
      } else {
        // User might not be in our list, create a minimal user object
        selectedUser.value = { xrplAddress: query.user, name: query.user.slice(0, 8) + '...' }
      }
    }
    showUserSlideover.value = true
  } else {
    showUserSlideover.value = false
  }

  if (query.amm && typeof query.amm === 'string') {
    // AMM query format: currency:issuer
    const [currency, issuer] = query.amm.split(':')
    if (currency && issuer) {
      // Only update if different token
      if (selectedToken.value?.currency !== currency || selectedToken.value?.issuer !== issuer) {
        selectedToken.value = { currency, issuer, amount: '0' }
      }
      showAmmSlideover.value = true
    }
  } else {
    showAmmSlideover.value = false
  }
}, { immediate: true })

// Sync slideover state back to URL
watch(showUserSlideover, (open) => {
  if (!open && route.query.user) {
    const { user, ...rest } = route.query
    router.replace({ query: rest })
  }
})

watch(showAmmSlideover, (open) => {
  if (!open && route.query.amm) {
    const { amm, ...rest } = route.query
    router.replace({ query: rest })
  }
})

// Track if users have been loaded
const usersLoaded = ref(false)

// Auto-open join modal when connected but not registered (after users loaded)
watch([isConnected, currentUser, usersLoaded], ([connected, user, loaded]) => {
  if (connected && !user && loaded) {
    nextTick(() => joinTraining())
  }
})

onMounted(async () => {
  // Load wallet state from storage
  await loadFromStorage()

  // Fetch users first
  await fetchUsers()
  usersLoaded.value = true

  // Refresh stats in background (non-blocking)
  refreshStats()

  // Connect wallet if not connected
  if (!isConnected.value) {
    await connectWallet()
  }
})

function openUserDetails(user: UserObject) {
  showAmmSlideover.value = false
  selectedUser.value = user
  showUserSlideover.value = true
  const { amm, ...rest } = route.query
  router.replace({ query: { ...rest, user: user.xrplAddress } })
  // Refresh stats for this user in the background
  refreshUserStats(user.xrplAddress)
}

function openUserDetailsByAddress(address: string) {
  const user = users.value.find(u => u.xrplAddress === address)
  if (user) {
    openUserDetails(user)
  } else {
    // User might not be in our list, create a minimal user object
    showAmmSlideover.value = false
    selectedUser.value = { xrplAddress: address, name: address.slice(0, 8) + '...' }
    showUserSlideover.value = true
    const { amm, ...rest } = route.query
    router.replace({ query: { ...rest, user: address } })
    // Refresh stats for this user in the background
    refreshUserStats(address)
  }
}

async function openAmmDetails(token: { currency: string; issuer: string; amount: string }) {
  showUserSlideover.value = false
  await nextTick()
  selectedToken.value = token
  showAmmSlideover.value = true
  const { user, ...rest } = route.query
  router.replace({ query: { ...rest, amm: `${token.currency}:${token.issuer}` } })
}

function joinTraining() {
  modal.open(JoinTrainingModal, {
    xrplAddress: xrplAddress.value
  })
}
</script>
