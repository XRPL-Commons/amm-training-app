<template>
  <div class="w-full max-w-4xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-title text-black dark:text-white">Training Session</h1>
      <UButton color="blue" @click="joinTraining" icon="i-heroicons-user-plus">
        Join
      </UButton>
    </div>

    <!-- Participants -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Participants</span>
          <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
            {{ users.length }}
          </span>
        </div>
      </div>

      <div v-if="users.length === 0" class="p-8 text-center text-gray-500">
        No participants yet. Be the first to join!
      </div>

      <table v-else class="w-full text-sm text-left">
        <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          <tr>
            <th class="py-3 px-4">Name</th>
            <th class="py-3 px-4">Address</th>
            <th class="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-gray-700 dark:text-gray-300">
          <tr
            v-for="user in users"
            :key="user.xrplAddress"
            class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <td class="py-3 px-4 font-medium">{{ user.name }}</td>
            <td class="py-3 px-4 font-mono text-xs text-gray-500">{{ user.xrplAddress }}</td>
            <td class="py-3 px-4 text-right">
              <UTooltip text="View details">
                <UButton
                  @click="openUserDetails(user)"
                  color="gray"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-eye"
                />
              </UTooltip>
            </td>
          </tr>
        </tbody>
      </table>
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
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UserObject } from '~/src/types'
import { QRCodeModal, JoinTrainingModal } from '#components'
import API from '~/server/client'

const modal = useModal()

// wallet
const userToken = ref('')
const xrplAddress = ref('')

// users
const users = ref<UserObject[]>([])

// Slideover state
const showUserSlideover = ref(false)
const showAmmSlideover = ref(false)
const selectedUser = ref<UserObject | null>(null)
const selectedToken = ref<{ currency: string; issuer: string; amount: string } | null>(null)

onMounted(async () => {
  userToken.value = localStorage.getItem('user_token') || ''
  xrplAddress.value = localStorage.getItem('xrpl_address') || ''

  if (!userToken.value || !xrplAddress.value) {
    await connectWallet()
  }
  await displayUsers()
})

function openUserDetails(user: UserObject) {
  selectedUser.value = user
  showUserSlideover.value = true
}

function openAmmDetails(token: { currency: string; issuer: string; amount: string }) {
  selectedToken.value = token
  showAmmSlideover.value = true
}

function connectWallet() {
  return new Promise(async (resolve, reject) => {
    try {
      const payload = await API.XamanSignIn()

      const qrCodeSrc = payload.refs.qr_png
      const mobileUrl = payload.next.always
      const websocket_status = payload.refs.websocket_status

      modal.open(QRCodeModal, {
        qrCodeSrc,
        mobileUrl
      })

      await initializeWebSocket({
        url: websocket_status,
        onMessage: async ({ data, wsClose }: { data: any; wsClose: any }) => {
          if (data.payload.tx_type == 'SignIn') {
            xrplAddress.value = data.response.account
            userToken.value = data.application.issued_user_token
            localStorage.setItem('xrpl_address', xrplAddress.value)
            localStorage.setItem('user_token', userToken.value)
            modal.close()
            wsClose()
            resolve(xrplAddress.value)
          }
        }
      })
    } catch (error) {
      alert('Error connecting to Xaman: ' + error)
      reject(error)
    }
  })
}

async function initializeWebSocket({ url, onMessage }: { url: string; onMessage?: any }) {
  const ws = new WebSocket(url)
  ws.onmessage = async (message) => {
    const responseObj = JSON.parse(message.data)
    const { signed, payload_uuidv4 } = responseObj

    if (signed !== true || !payload_uuidv4) {
      return
    }

    const data: any = await API.XamanGetPayload({ uuid: payload_uuidv4 })

    const runtimeConfig = useRuntimeConfig()
    if (data.response.environment_nodetype !== runtimeConfig.public.network) {
      alert('Wrong network: please use ' + runtimeConfig.public.network)
      await connectWallet()
      return
    }

    await onMessage({
      data,
      wsClose: () => ws.close()
    })
  }

  return ws
}

async function displayUsers() {
  try {
    users.value = await API.getUsers({})
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

function joinTraining() {
  modal.open(JoinTrainingModal, {
    xrplAddress,
    onClose: async () => {
      modal.close()
      await displayUsers()
    }
  })
}
</script>
