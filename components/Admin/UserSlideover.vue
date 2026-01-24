<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-md' }">
    <div class="p-6 h-full overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-title text-gray-800 dark:text-white">{{ user?.name }}</h2>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
      </div>

      <!-- Address -->
      <div class="mb-6">
        <div class="text-xs text-gray-500 uppercase mb-1">Address</div>
        <ColoredAddress v-if="user?.xrplAddress" :address="user.xrplAddress" />
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

        <div v-else-if="regularTokens.length === 0" class="text-center py-8 text-gray-500">
          No tokens found
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="token in regularTokens"
            :key="`${token.currency}-${token.issuer}`"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-800 dark:text-white">{{ token.currency }}</span>
              <div class="text-gray-600 dark:text-gray-400">{{ formatAmount(token.amount) }}</div>
            </div>
            <div class="text-xs text-gray-500 truncate mt-1">{{ token.issuer }}</div>
            <div class="text-xs text-gray-400 mt-1 mb-2">
              Limit: {{ formatAmount(token.limit) }}
            </div>
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
                icon="i-heroicons-pencil-square"
                @click="openLimitModal(token)"
                :loading="trustlineLoading === token.currency"
              >
                Edit Limit
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- LP Tokens / Pool Positions -->
      <div v-if="lpTokensWithPool.length > 0" class="mt-6">
        <div class="text-xs text-gray-500 uppercase mb-3">Pool Positions</div>
        <div class="space-y-2">
          <div
            v-for="lp in lpTokensWithPool"
            :key="`${lp.currency}-${lp.issuer}`"
            class="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span v-if="lp.poolInfo" class="font-medium text-gray-800 dark:text-white">
                  {{ lp.poolInfo.asset1.currency }} / {{ lp.poolInfo.asset2.currency }}
                </span>
                <span v-else class="font-medium text-gray-800 dark:text-white">LP Token</span>
                <span class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-500/20 text-purple-400">
                  {{ lp.poolInfo?.tradingFee || 'AMM' }}
                </span>
              </div>
              <div class="text-gray-600 dark:text-gray-400">{{ formatAmount(lp.amount) }}</div>
            </div>
            <div class="text-xs text-gray-500 truncate mt-1">{{ lp.issuer }}</div>
            <div v-if="lp.poolInfo" class="flex gap-2 mt-2">
              <UButton
                size="xs"
                color="purple"
                variant="soft"
                icon="i-heroicons-arrow-path-rounded-square"
                @click="$emit('viewAmm', getNonXrpAsset(lp.poolInfo))"
              >
                View Pool
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trustline Limit Modal -->
    <UModal v-model="showLimitModal">
      <div class="p-6">
        <h3 class="text-lg font-title mb-4 text-gray-800 dark:text-white">
          Set Trustline Limit
        </h3>
        <div v-if="editingToken" class="mb-4">
          <div class="text-sm text-gray-500 mb-1">{{ editingToken.currency }}</div>
          <div class="mb-2">
            <ColoredAddress :address="editingToken.issuer" />
          </div>
          <div class="text-xs text-gray-400 mb-4">
            Current limit: {{ formatAmount(editingToken.limit) }}
          </div>
          <UFormGroup label="New Limit" :hint="formatLimitHint(newLimit)">
            <UInput
              v-model="newLimit"
              type="text"
              placeholder="Enter new limit amount"
              size="lg"
            />
          </UFormGroup>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <UButton color="gray" variant="soft" @click="showLimitModal = false">
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="confirmSetTrustline"
            :loading="trustlineLoading === editingToken?.currency"
          >
            Set Limit
          </UButton>
        </div>
      </div>
    </UModal>

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
  limit: string
  isLPToken: boolean
}

interface PoolInfo {
  asset1: { currency: string; amount: string; issuer?: string }
  asset2: { currency: string; amount: string; issuer?: string }
  tradingFee: string
  account: string
}

interface LPTokenWithPool extends Token {
  poolInfo?: PoolInfo | null
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
const lpTokensWithPool = ref<LPTokenWithPool[]>([])
const accountInfo = ref<any>(null)
const trustlineLoading = ref<string | null>(null)

const regularTokens = computed(() => tokens.value.filter(t => !t.isLPToken))

// QR Modal state
const showQrModal = ref(false)
const qrCodeSrc = ref('')
const mobileUrl = ref('')

// Trustline edit state
const showLimitModal = ref(false)
const editingToken = ref<Token | null>(null)
const newLimit = ref('')

watch(() => props.user, async (newUser) => {
  if (newUser) {
    await loadData()
  }
}, { immediate: true })

async function loadData() {
  if (!props.user) return
  loading.value = true
  tokens.value = []
  lpTokensWithPool.value = []
  accountInfo.value = null

  try {
    const [tokensResult, accountResult] = await Promise.all([
      API.getTokens({ xrplAddress: props.user.xrplAddress }),
      API.getAccountInfo({ xrplAddress: props.user.xrplAddress })
    ])
    tokens.value = tokensResult
    accountInfo.value = accountResult

    // Fetch pool info for LP tokens
    const lpTokens = tokensResult.filter((t: Token) => t.isLPToken)
    const poolInfoPromises = lpTokens.map(async (token: Token) => {
      const poolInfo = await API.getAmmByAccount({ ammAccount: token.issuer })
      return { ...token, poolInfo }
    })
    lpTokensWithPool.value = await Promise.all(poolInfoPromises)
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

function openLimitModal(token: Token) {
  editingToken.value = token
  newLimit.value = token.limit
  showLimitModal.value = true
}

async function confirmSetTrustline() {
  if (!editingToken.value) return
  await setTrustline(editingToken.value, newLimit.value)
  showLimitModal.value = false
}

async function setTrustline(token: Token, limit?: string) {
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
      currency: token.currency,
      limit: limit
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

function formatLimitHint(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return ''
  if (Math.abs(num) >= 1_000_000_000_000) return `= ${(num / 1_000_000_000_000).toFixed(2)} Trillion`
  if (Math.abs(num) >= 1_000_000_000) return `= ${(num / 1_000_000_000).toFixed(2)} Billion`
  if (Math.abs(num) >= 1_000_000) return `= ${(num / 1_000_000).toFixed(2)} Million`
  if (Math.abs(num) >= 1_000) return `= ${(num / 1_000).toFixed(2)} Thousand`
  return `= ${num.toLocaleString()}`
}

function getNonXrpAsset(poolInfo: PoolInfo) {
  // Find the non-XRP asset to use for viewing the AMM
  if (poolInfo.asset1.currency !== 'XRP') {
    return {
      currency: poolInfo.asset1.currency,
      issuer: poolInfo.asset1.issuer || '',
      amount: poolInfo.asset1.amount
    }
  }
  return {
    currency: poolInfo.asset2.currency,
    issuer: poolInfo.asset2.issuer || '',
    amount: poolInfo.asset2.amount
  }
}
</script>
