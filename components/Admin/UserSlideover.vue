<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-md' }">
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-title text-gray-800 dark:text-white">{{ user?.name }}</h2>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
      </div>

      <!-- Address -->
      <div class="mb-6">
        <div class="text-xs text-gray-500 uppercase mb-1">Address</div>
        <div class="font-mono text-sm text-gray-700 dark:text-gray-300 break-all">
          {{ user?.xrplAddress }}
        </div>
      </div>

      <!-- Account Info -->
      <div class="mb-6" v-if="accountInfo">
        <div class="text-xs text-gray-500 uppercase mb-2">XRP Balance</div>
        <div class="text-2xl font-bold text-gray-800 dark:text-white">
          {{ formatXrp(accountInfo.result?.account_data?.Balance) }} XRP
        </div>
      </div>

      <!-- Tokens -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs text-gray-500 uppercase">Tokens</div>
          <UButton
            v-if="tokens.length > 0"
            color="gray"
            variant="ghost"
            size="xs"
            icon="i-heroicons-arrow-path"
            @click="loadTokens"
          />
        </div>

        <div v-if="loading" class="text-center py-8 text-gray-500">
          <Icon name="heroicons:arrow-path" class="w-6 h-6 animate-spin" />
        </div>

        <div v-else-if="tokens.length === 0" class="text-center py-8 text-gray-500">
          No tokens found
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="token in tokens"
            :key="`${token.currency}-${token.issuer}`"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <div class="flex items-center justify-between">
              <div class="font-medium text-gray-800 dark:text-white">{{ token.currency }}</div>
              <div class="text-gray-600 dark:text-gray-400">{{ formatAmount(token.amount) }}</div>
            </div>
            <div class="text-xs text-gray-500 truncate mt-1 mb-2">{{ token.issuer }}</div>
            <div class="flex gap-2">
              <UButton
                size="xs"
                color="gray"
                variant="soft"
                icon="i-heroicons-arrow-path-rounded-square"
                @click="$emit('viewAmm', token)"
              >
                AMM
              </UButton>
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-link"
                @click="setTrustline(token)"
                :loading="trustlineLoading === token.currency"
              >
                Trustline
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Code Modal for signing -->
    <UModal v-model="showQrModal">
      <div class="p-6 text-center">
        <h3 class="text-lg font-title mb-4 text-gray-800 dark:text-white">Sign with Xaman</h3>
        <img v-if="qrCodeSrc" :src="qrCodeSrc" class="mx-auto mb-4 rounded-lg" />
        <p class="text-sm text-gray-500 mb-4">Scan with Xaman or click below on mobile</p>
        <UButton v-if="mobileUrl" :to="mobileUrl" external color="primary" block>
          Open Xaman
        </UButton>
      </div>
    </UModal>
  </USlideover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import API from '~/server/client'

interface User {
  xrplAddress: string
  name: string
  createdAt?: string
}

interface Token {
  currency: string
  issuer: string
  amount: string
}

const props = defineProps<{
  user: User | null
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'viewAmm': [token: Token]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const tokens = ref<Token[]>([])
const accountInfo = ref<any>(null)
const trustlineLoading = ref<string | null>(null)

// QR Modal state
const showQrModal = ref(false)
const qrCodeSrc = ref('')
const mobileUrl = ref('')

watch(() => props.user, async (newUser) => {
  if (newUser) {
    await loadData()
  }
}, { immediate: true })

async function loadData() {
  if (!props.user) return
  loading.value = true
  tokens.value = []
  accountInfo.value = null

  try {
    const [tokensResult, accountResult] = await Promise.all([
      API.getTokens({ xrplAddress: props.user.xrplAddress }),
      API.getAccountInfo({ xrplAddress: props.user.xrplAddress })
    ])
    tokens.value = tokensResult
    accountInfo.value = accountResult
  } catch (error) {
    console.error('Failed to load user data:', error)
  } finally {
    loading.value = false
  }
}

async function loadTokens() {
  if (!props.user) return
  loading.value = true
  try {
    tokens.value = await API.getTokens({ xrplAddress: props.user.xrplAddress })
  } catch (error) {
    console.error('Failed to load tokens:', error)
  } finally {
    loading.value = false
  }
}

async function setTrustline(token: Token) {
  if (!props.user) return

  const userToken = localStorage.getItem('user_token')
  if (!userToken) {
    alert('Please sign in with Xaman first')
    return
  }

  trustlineLoading.value = token.currency

  try {
    const payload = await API.createTrustline({
      userToken,
      account: props.user.xrplAddress,
      issuer: token.issuer,
      currency: token.currency
    })

    qrCodeSrc.value = payload.refs.qr_png
    mobileUrl.value = payload.next.always
    showQrModal.value = true

    // Listen for signing
    const ws = new WebSocket(payload.refs.websocket_status)
    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data)
      if (data.signed === true) {
        showQrModal.value = false
        ws.close()
        await loadTokens()
      }
    }
  } catch (error) {
    console.error('Failed to create trustline:', error)
    alert('Failed to create trustline')
  } finally {
    trustlineLoading.value = null
  }
}

function formatXrp(drops: string | undefined): string {
  if (!drops) return '0'
  return (parseInt(drops) / 1_000_000).toLocaleString()
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount)
  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(2) + 'K'
  return num.toLocaleString()
}
</script>
