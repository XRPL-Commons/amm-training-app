<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-lg' }">
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-title text-gray-800 dark:text-white">
            {{ amm?.pool1?.currency }}/{{ amm?.pool2?.currency }}
          </h2>
          <div class="text-sm text-gray-500">AMM Pool</div>
        </div>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
      </div>

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
            <div class="flex items-center gap-2">
              <UInput
                v-model="swapAmount"
                type="number"
                placeholder="Amount"
                class="flex-1"
              />
              <USelect
                v-model="currencyFrom"
                :options="currencyOptions"
                class="w-24"
              />
            </div>
            <div class="flex justify-center">
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-arrows-up-down"
                size="xs"
                @click="swapCurrencies"
              />
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-2 text-gray-600 dark:text-gray-400">
                {{ estimatedOutput }}
              </div>
              <div class="w-24 text-center font-medium text-gray-800 dark:text-white">
                {{ currencyTo }}
              </div>
            </div>
            <UButton
              color="primary"
              block
              :loading="swapping"
              :disabled="!swapAmount || swapping"
              @click="executeSwap"
            >
              Swap
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
              class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
                  {{ holder.account }}
                </span>
                <span class="text-sm font-medium text-gray-800 dark:text-white">{{ holder.share }}</span>
              </div>
              <div class="text-xs text-gray-500">{{ formatAmount(holder.amount.toString()) }} LP</div>
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

// QR Modal state
const showQrModal = ref(false)
const qrCodeSrc = ref('')
const mobileUrl = ref('')

const currencyOptions = computed(() => {
  if (!amm.value) return []
  return [amm.value.pool1.currency, amm.value.pool2.currency]
})

const estimatedOutput = computed(() => {
  if (!amm.value || !swapAmount.value) return '0'
  const amount = parseFloat(swapAmount.value)
  if (isNaN(amount)) return '0'

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  if (currencyFrom.value === amm.value.pool1.currency) {
    return formatAmount((amount * (pool2Amount / pool1Amount)).toString())
  } else {
    return formatAmount((amount * (pool1Amount / pool2Amount)).toString())
  }
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

  try {
    amm.value = await API.getAmm({
      issuer: props.token.issuer,
      currency: props.token.currency
    })
    // Set initial currencies
    currencyFrom.value = amm.value.pool2.currency
    currencyTo.value = amm.value.pool1.currency
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
  if (amm.value.pool1.currency === 'XRP') {
    const price = parseFloat(amm.value.pool2.amount) / parseFloat(amm.value.pool1.amount)
    return price.toFixed(2) + ' ' + amm.value.pool2.currency
  } else {
    const price = parseFloat(amm.value.pool1.amount) / parseFloat(amm.value.pool2.amount)
    return price.toFixed(2) + ' ' + amm.value.pool1.currency
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
