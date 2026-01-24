<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-lg' }">
    <div class="h-full flex flex-col">
      <!-- Fixed Header -->
      <div class="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-title text-gray-800 dark:text-white">
              {{ amm?.pool1?.currency }}/{{ amm?.pool2?.currency }}
            </h2>
            <div class="text-sm text-gray-500">AMM Pool</div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-6 pt-4">
        <div v-if="loading" class="text-center py-12 text-gray-500">
          <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin" />
        </div>

        <div v-else-if="error" class="text-center py-12 text-red-500">
          {{ error }}
        </div>

        <div v-else-if="amm">
        <!-- Pool Stats -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-500 uppercase">Trading Fee</div>
            <div class="text-lg font-bold text-gray-800 dark:text-white">{{ amm.trading_fee }}</div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-500 uppercase">Price</div>
            <div class="text-lg font-bold text-gray-800 dark:text-white">{{ getPrice() }}</div>
          </div>
        </div>

        <!-- Pool Composition -->
        <div class="mb-6">
          <div class="text-xs text-gray-500 uppercase mb-3">Pool Composition</div>
          <div class="space-y-3">
            <div class="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span class="font-medium text-gray-800 dark:text-white">{{ amm.pool1.currency }}</span>
              </div>
              <span class="text-gray-600 dark:text-gray-400">{{ formatAmount(amm.pool1.amount) }}</span>
            </div>
            <div class="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <span class="font-medium text-gray-800 dark:text-white">{{ amm.pool2.currency }}</span>
              </div>
              <span class="text-gray-600 dark:text-gray-400">{{ formatAmount(amm.pool2.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Swap Section -->
        <div class="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="text-xs text-gray-500 uppercase mb-3">Swap</div>
          <div class="space-y-3">
            <!-- You Pay -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-500">You pay</span>
                <span class="text-xs text-gray-400">
                  Balance: {{ userBalanceFrom }}
                  <button
                    v-if="userBalanceFromNum > 0"
                    class="text-primary-500 hover:text-primary-400 ml-1"
                    @click="swapAmount = userBalanceFromNum.toString()"
                  >
                    Max
                  </button>
                </span>
              </div>
              <div class="flex items-center gap-2">
                <UInput
                  v-model="swapAmount"
                  type="number"
                  placeholder="0"
                  class="flex-1"
                  :ui="{ wrapper: insufficientBalance ? 'ring-2 ring-red-500 rounded-full' : '' }"
                />
                <div class="flex bg-gray-100 dark:bg-gray-700 rounded-full p-0.5">
                  <button
                    v-for="currency in [amm?.pool1?.currency, amm?.pool2?.currency]"
                    :key="currency"
                    @click="currencyFrom = currency"
                    :class="[
                      'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                      currencyFrom === currency
                        ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    ]"
                  >
                    {{ currency }}
                  </button>
                </div>
              </div>
              <div v-if="insufficientBalance" class="text-xs text-red-500 mt-1">
                Insufficient balance
              </div>
            </div>

            <div class="flex justify-center">
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-arrow-down"
                size="xs"
                @click="swapCurrencies"
              />
            </div>

            <!-- You Receive -->
            <div>
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>You receive</span>
                <span class="font-medium text-gray-800 dark:text-white">{{ estimatedOutput }} {{ currencyTo }}</span>
              </div>
            </div>

            <!-- Trade Info & Warnings -->
            <div v-if="swapAmount && parseFloat(swapAmount) > 0" class="space-y-2 text-xs">
              <!-- Price Impact -->
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Price impact</span>
                <span :class="priceImpactColor">{{ priceImpact }}</span>
              </div>

              <!-- Pool % -->
              <div class="flex items-center justify-between">
                <span class="text-gray-500">You receive % of pool</span>
                <span :class="poolPercentColor">{{ poolPercentOfOutput }}</span>
              </div>

              <!-- High Impact Warning -->
              <div
                v-if="priceImpactNum > 5"
                class="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-red-400"
              >
                <div class="flex items-center gap-2">
                  <Icon name="heroicons:exclamation-triangle" class="w-4 h-4" />
                  <span class="font-medium">High price impact!</span>
                </div>
                <p class="mt-1 text-red-400/80">
                  This trade moves the price significantly. You're trading against a small pool.
                </p>
              </div>

              <!-- Pool After Trade Preview -->
              <div class="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 mt-2">
                <div class="text-gray-500 mb-1">Pool after trade</div>
                <div class="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{{ currencyFrom }}: {{ poolAfterFrom }}</span>
                  <span>{{ currencyTo }}: {{ poolAfterTo }}</span>
                </div>
              </div>
            </div>

            <UButton
              :color="priceImpactNum > 10 ? 'red' : 'primary'"
              block
              :loading="swapping"
              :disabled="!swapAmount || swapping || insufficientBalance"
              @click="executeSwap"
            >
              {{ priceImpactNum > 10 ? 'Swap anyway (high impact)' : `Swap ${currencyFrom} for ${currencyTo}` }}
            </UButton>
          </div>
        </div>

        <!-- LP Token Holders -->
        <div>
          <div class="text-xs text-gray-500 uppercase mb-3">LP Holders ({{ amm.lpToken.holders.length }})</div>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="holder in amm.lpToken.holders"
              :key="holder.account"
              :class="[
                'rounded-lg p-3 cursor-pointer transition-colors',
                holder.account === currentUserAddress
                  ? 'bg-primary-500/10 border border-primary-500/30 hover:bg-primary-500/20'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              @click="emit('viewUser', holder.account)"
            >
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <ColoredAddress :address="holder.account" variant="text" class="text-xs" />
                  <span
                    v-if="holder.account === currentUserAddress"
                    class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary-500/20 text-primary-400"
                  >
                    You
                  </span>
                </div>
                <span class="text-sm font-medium text-gray-800 dark:text-white">{{ holder.share }}</span>
              </div>
              <div class="text-xs text-gray-500">{{ formatAmount(holder.amount.toString()) }} LP</div>
            </div>
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
import { ref, watch, computed } from 'vue'
import API from '~/server/client'

interface Token {
  currency: string
  issuer: string
  amount: string
}

interface AmmPool {
  currency: string
  amount: string
  issuer: string
}

interface LpHolder {
  account: string
  amount: number
  share: string
}

interface Amm {
  pool1: AmmPool
  pool2: AmmPool
  trading_fee: string
  lpToken: {
    issuer: string
    amount: string
    currency: string
    holders: LpHolder[]
  }
  id: string
}

const props = defineProps<{
  token: Token | null
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'viewUser': [address: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const error = ref('')
const amm = ref<Amm | null>(null)
const swapping = ref(false)

// Swap state
const swapAmount = ref('')
const currencyFrom = ref('')
const currencyTo = ref('')

// User balance state
interface UserToken {
  currency: string
  amount: string
  issuer?: string
}
const userTokens = ref<UserToken[]>([])
const userXrpBalance = ref('0')

// QR Modal state
const showQrModal = ref(false)
const qrCodeSrc = ref('')
const mobileUrl = ref('')

const userBalanceFromNum = computed(() => {
  if (!currencyFrom.value) return 0
  if (currencyFrom.value === 'XRP') {
    return parseFloat(userXrpBalance.value) || 0
  }
  const token = userTokens.value.find(t => t.currency === currencyFrom.value)
  return token ? parseFloat(token.amount) : 0
})

const userBalanceFrom = computed(() => {
  return formatAmount(userBalanceFromNum.value.toString())
})

const insufficientBalance = computed(() => {
  if (!swapAmount.value) return false
  const amount = parseFloat(swapAmount.value)
  if (isNaN(amount)) return false
  return amount > userBalanceFromNum.value
})

// Raw output amount (not formatted)
const estimatedOutputNum = computed(() => {
  if (!amm.value || !swapAmount.value) return 0
  const inputAmount = parseFloat(swapAmount.value)
  if (isNaN(inputAmount) || inputAmount <= 0) return 0

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  // AMM constant product formula: outputAmount = (inputAmount * outputReserve) / (inputReserve + inputAmount)
  let outputAmount: number
  if (currencyFrom.value === amm.value.pool1.currency) {
    outputAmount = (inputAmount * pool2Amount) / (pool1Amount + inputAmount)
  } else {
    outputAmount = (inputAmount * pool1Amount) / (pool2Amount + inputAmount)
  }

  // Apply trading fee
  const feePercent = parseFloat(amm.value.trading_fee) / 100
  return outputAmount * (1 - feePercent)
})

const estimatedOutput = computed(() => {
  return formatAmount(estimatedOutputNum.value.toString())
})

// Price impact calculation
const priceImpactNum = computed(() => {
  if (!amm.value || !swapAmount.value) return 0
  const inputAmount = parseFloat(swapAmount.value)
  if (isNaN(inputAmount) || inputAmount <= 0) return 0

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  // Spot price (what you'd get for infinitely small trade)
  let spotPrice: number
  if (currencyFrom.value === amm.value.pool1.currency) {
    spotPrice = pool2Amount / pool1Amount
  } else {
    spotPrice = pool1Amount / pool2Amount
  }

  // Effective price (what you actually get)
  const effectivePrice = estimatedOutputNum.value / inputAmount

  // Price impact = (spotPrice - effectivePrice) / spotPrice * 100
  return ((spotPrice - effectivePrice) / spotPrice) * 100
})

const priceImpact = computed(() => {
  return priceImpactNum.value.toFixed(2) + '%'
})

const priceImpactColor = computed(() => {
  if (priceImpactNum.value > 10) return 'text-red-500 font-medium'
  if (priceImpactNum.value > 5) return 'text-orange-500 font-medium'
  if (priceImpactNum.value > 1) return 'text-yellow-500'
  return 'text-green-500'
})

// Pool percentage of output
const poolPercentOfOutput = computed(() => {
  if (!amm.value || estimatedOutputNum.value <= 0) return '0%'

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  const outputPool = currencyFrom.value === amm.value.pool1.currency ? pool2Amount : pool1Amount
  const percent = (estimatedOutputNum.value / outputPool) * 100

  return percent.toFixed(1) + '%'
})

const poolPercentColor = computed(() => {
  if (!amm.value) return 'text-gray-400'

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)
  const outputPool = currencyFrom.value === amm.value.pool1.currency ? pool2Amount : pool1Amount
  const percent = (estimatedOutputNum.value / outputPool) * 100

  if (percent > 50) return 'text-red-500 font-medium'
  if (percent > 20) return 'text-orange-500 font-medium'
  if (percent > 5) return 'text-yellow-500'
  return 'text-gray-400'
})

// Pool state after trade
const poolAfterFrom = computed(() => {
  if (!amm.value || !swapAmount.value) return '-'
  const inputAmount = parseFloat(swapAmount.value)
  if (isNaN(inputAmount) || inputAmount <= 0) return '-'

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  const currentPool = currencyFrom.value === amm.value.pool1.currency ? pool1Amount : pool2Amount
  return formatAmount((currentPool + inputAmount).toString())
})

const poolAfterTo = computed(() => {
  if (!amm.value || !swapAmount.value) return '-'
  const inputAmount = parseFloat(swapAmount.value)
  if (isNaN(inputAmount) || inputAmount <= 0) return '-'

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  const currentPool = currencyFrom.value === amm.value.pool1.currency ? pool2Amount : pool1Amount
  // Note: estimatedOutputNum already has fee applied, but pool loses the full amount before fee
  const outputBeforeFee = estimatedOutputNum.value / (1 - parseFloat(amm.value.trading_fee) / 100)
  return formatAmount((currentPool - outputBeforeFee).toString())
})

// Current user address for highlighting LP holders
const currentUserAddress = computed(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('xrpl_address') || ''
  }
  return ''
})

watch(() => props.token, async (newToken) => {
  if (newToken && isOpen.value) {
    await loadAmm()
  }
}, { immediate: true })

watch(isOpen, async (open) => {
  if (open && props.token) {
    await loadAmm()
  }
})

watch(currencyFrom, (newVal) => {
  if (!amm.value) return
  currencyTo.value = newVal === amm.value.pool1.currency
    ? amm.value.pool2.currency
    : amm.value.pool1.currency
})

async function loadAmm() {
  if (!props.token) return
  loading.value = true
  error.value = ''
  amm.value = null
  swapAmount.value = ''
  userTokens.value = []
  userXrpBalance.value = '0'

  try {
    amm.value = await API.getAmm({
      issuer: props.token.issuer,
      currency: props.token.currency
    })
    // Set initial currencies
    currencyFrom.value = amm.value.pool2.currency
    currencyTo.value = amm.value.pool1.currency

    // Load user balances
    const userAddress = localStorage.getItem('xrpl_address')
    if (userAddress) {
      try {
        const [tokens, accountInfo] = await Promise.all([
          API.getTokens({ xrplAddress: userAddress }),
          API.getAccountInfo({ xrplAddress: userAddress })
        ])
        userTokens.value = tokens
        // XRP balance is in drops, convert to XRP
        const drops = accountInfo?.result?.account_data?.Balance || '0'
        userXrpBalance.value = (parseInt(drops) / 1_000_000).toString()
      } catch (e) {
        console.warn('Could not load user balances')
      }
    }
  } catch (e) {
    error.value = 'No AMM pool found for this token'
  } finally {
    loading.value = false
  }
}

function swapCurrencies() {
  const temp = currencyFrom.value
  currencyFrom.value = currencyTo.value
  currencyTo.value = temp
}

async function executeSwap() {
  if (!amm.value || !props.token || !swapAmount.value) return

  const userToken = localStorage.getItem('user_token')
  const userAddress = localStorage.getItem('xrpl_address')

  if (!userToken || !userAddress) {
    alert('Please sign in with Xaman first')
    return
  }

  swapping.value = true

  try {
    const payload = await API.tradeAmm({
      userToken,
      buyer: userAddress,
      currencyFrom: currencyFrom.value,
      currencyFromPoolSize: currencyFrom.value === amm.value.pool1.currency
        ? amm.value.pool1.amount
        : amm.value.pool2.amount,
      currencyTo: currencyTo.value,
      currencyToPoolSize: currencyTo.value === amm.value.pool1.currency
        ? amm.value.pool1.amount
        : amm.value.pool2.amount,
      amount: swapAmount.value,
      issuer: props.token.issuer
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
        swapAmount.value = ''
        await loadAmm() // Refresh pool data
      }
    }
  } catch (error) {
    console.error('Failed to execute swap:', error)
    alert('Failed to execute swap')
  } finally {
    swapping.value = false
  }
}

function getPrice(): string {
  if (!amm.value) return ''
  // Show price as "1 XRP = X tokens" format
  if (amm.value.pool1.currency === 'XRP') {
    const price = parseFloat(amm.value.pool2.amount) / parseFloat(amm.value.pool1.amount)
    return formatAmount(price.toString()) + ' ' + amm.value.pool2.currency
  } else {
    const price = parseFloat(amm.value.pool1.amount) / parseFloat(amm.value.pool2.amount)
    return formatAmount(price.toString()) + ' ' + amm.value.pool1.currency
  }
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount)
  if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B'
  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(2) + 'K'
  return num.toLocaleString()
}
</script>
