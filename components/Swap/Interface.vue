<template>
  <div class="flex flex-col md:flex-row gap-8">
    <!-- Swap Interface -->
    <div class="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
      <h2 class="text-xl font-semibold mb-6 dark:text-white">Swap</h2>
      
      <div class="space-y-6">
        <!-- Pay -->
        <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="flex justify-between mb-2">
            <label class="text-sm font-medium text-gray-500">You Pay</label>
            <span class="text-sm text-gray-500">Balance: {{ payBalance }} {{ payCurrency }}</span>
          </div>
          <div class="flex gap-4">
            <UInput v-model="internalPayAmount" type="number" placeholder="0.0" class="flex-1" size="xl" />
            <USelect v-model="internalPayCurrency" :options="['XRP', selectedPool?.tokenCurrency].filter(Boolean)" class="w-32" size="xl" />
          </div>
        </div>

        <div class="flex justify-center -my-2 relative z-10">
          <UButton icon="i-heroicons-arrows-up-down" color="gray" variant="solid" class="rounded-full shadow-md" @click="swapCurrencies" />
        </div>

        <!-- Receive -->
        <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="flex justify-between mb-2">
            <label class="text-sm font-medium text-gray-500">You Receive (Estimated)</label>
            <span class="text-sm text-gray-500">Balance: {{ receiveBalance }} {{ receiveCurrency }}</span>
          </div>
          <div class="flex gap-4">
            <UInput :value="estimatedReceive" readonly placeholder="0.0" class="flex-1 opacity-75" size="xl" />
            <div class="w-32 flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md font-semibold dark:text-white border border-gray-200 dark:border-gray-700">
              {{ receiveCurrency }}
            </div>
          </div>
        </div>

        <UButton
          label="Execute Swap"
          color="primary"
          size="xl"
          block
          :loading="isSwapping"
          :disabled="!isValid || isSwapping"
          @click="executeSwap"
        />

        <div v-if="status.error" class="text-red-500 text-sm text-center">
          {{ errorMessage }}
        </div>
        <div v-if="status.complete" class="text-green-500 text-sm text-center font-bold">
          Swap Successful!
        </div>
      </div>
    </div>

    <!-- Pool Stats -->
    <div class="flex-1 bg-gray-900 rounded-xl shadow-lg p-6 text-white flex flex-col justify-between relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10" />
      <div class="absolute bottom-0 left-0 w-32 h-32 bg-green-500 rounded-full blur-3xl opacity-20 -ml-10 -mb-10" />

      <div class="relative z-10">
        <h2 class="text-xl font-semibold mb-6">AMM Pool Stats</h2>
        <div v-if="isLoadingPool" class="flex items-center gap-2 text-gray-400">
          <Icon name="eos-icons:loading" class="w-5 h-5" /> Loading pool data...
        </div>
        <div v-else-if="poolData" class="space-y-6">
          <div class="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div class="text-sm text-gray-400">Pool Pair</div>
            <div class="font-bold">XRP / {{ selectedPool?.tokenCurrency }}</div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-gray-800 rounded-lg text-center">
              <div class="text-sm text-gray-400 mb-1">XRP Reserve</div>
              <div class="font-mono text-lg text-blue-400">{{ formatReserve(poolData.amount) }}</div>
            </div>
            <div class="p-4 bg-gray-800 rounded-lg text-center">
              <div class="text-sm text-gray-400 mb-1">{{ selectedPool?.tokenCurrency }} Reserve</div>
              <div class="font-mono text-lg text-green-400">{{ formatReserve(poolData.amount2) }}</div>
            </div>
          </div>

          <div class="p-4 bg-gray-800 rounded-lg text-center">
            <div class="text-sm text-gray-400 mb-1">Current Spot Price</div>
            <div class="font-bold text-xl">{{ spotPrice }} {{ selectedPool?.tokenCurrency }} per XRP</div>
          </div>
        </div>
        <div v-else class="text-red-400 text-sm">
          Could not load pool. Have you created it?
        </div>
      </div>

      <div class="relative z-10 mt-8" v-if="status.complete">
        <UButton
          label="Complete Training"
          color="white"
          variant="solid"
          size="xl"
          block
          @click="completeTraining"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  selectedPool: any
  payAmount: string
  payCurrency: string
  receiveCurrency: string
  payBalance: string
  receiveBalance: string
  poolData: any
  isLoadingPool: boolean
  isSwapping: boolean
  status: { complete: boolean; error: boolean }
  errorMessage: string
  estimatedReceive: string
  spotPrice: string
  isValid: boolean
}>()

const emit = defineEmits<{
  (e: 'update:payAmount', value: string): void
  (e: 'update:payCurrency', value: string): void
  (e: 'swapCurrencies'): void
  (e: 'executeSwap'): void
  (e: 'completeTraining'): void
}>()

const internalPayAmount = computed({
  get: () => props.payAmount,
  set: (val) => emit('update:payAmount', val)
})

const internalPayCurrency = computed({
  get: () => props.payCurrency,
  set: (val) => emit('update:payCurrency', val)
})

function swapCurrencies() { emit('swapCurrencies') }
function executeSwap() { emit('executeSwap') }
function completeTraining() { emit('completeTraining') }

const formatReserve = (amountObj: any) => {
  if (typeof amountObj === 'string') return (Number(amountObj) / 1000000).toFixed(2)
  if (amountObj?.value) return Number(amountObj.value).toFixed(2)
  return '0'
}
</script>
