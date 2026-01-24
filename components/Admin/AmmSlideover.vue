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

        <!-- LP Token Holders -->
        <div>
          <div class="text-xs text-gray-500 uppercase mb-3">LP Token Holders ({{ amm.lpToken.holders.length }})</div>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="holder in amm.lpToken.holders"
              :key="holder.account"
              class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
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
  </USlideover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

async function loadAmm() {
  if (!props.token) return
  loading.value = true
  error.value = ''
  amm.value = null

  try {
    amm.value = await API.getAmm({
      issuer: props.token.issuer,
      currency: props.token.currency
    })
  } catch (e) {
    error.value = 'No AMM pool found for this token'
  } finally {
    loading.value = false
  }
}

function getPrice(): string {
  if (!amm.value) return ''
  if (amm.value.pool1.currency === 'XRP') {
    const price = parseInt(amm.value.pool2.amount) / parseInt(amm.value.pool1.amount)
    return price.toFixed(2) + ' ' + amm.value.pool2.currency
  } else {
    const price = parseInt(amm.value.pool1.amount) / parseInt(amm.value.pool2.amount)
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
