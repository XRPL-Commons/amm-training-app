<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white">Choose a Pool to Trade Against</h2>
      <UButton icon="i-heroicons-arrow-path" color="gray" variant="ghost" size="sm" :loading="isLoadingPools" @click="loadPools">
        Refresh
      </UButton>
    </div>

    <div v-if="isLoadingPools" class="flex items-center justify-center py-16 text-gray-400 gap-3">
      <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
      Loading participant pools...
    </div>

    <div v-else-if="participantPools.length === 0" class="text-center py-16 text-gray-400">
      <Icon name="heroicons:cube-transparent" class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="text-sm">No pools available yet. Participants need to complete Step 3 first.</p>
    </div>

    <div v-else class="space-y-3">
      <button
        v-for="pool in participantPools"
        :key="pool.ammAccount"
        class="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
        @click="openPoolModal(pool)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <ColoredAddress :address="pool.participantAddress" variant="bars" />
            <div>
              <div class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {{ pool.participantName }}
                <UBadge v-if="isOwnPool(pool)" color="blue" variant="subtle" size="xs">Your Pool</UBadge>
              </div>
              <div class="text-sm text-gray-500">XRP / {{ pool.tokenCurrency }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-mono text-gray-700 dark:text-gray-300">
              {{ (Number(pool.xrpReserve) || 0).toFixed(2) }} XRP · {{ (Number(pool.tokenReserve) || 0).toFixed(2) }} {{ pool.tokenCurrency }}
            </div>
            <div class="flex items-center justify-end gap-2 mt-1">
              <span class="text-xs text-gray-400">Fee {{ pool.tradingFee }}</span>
              <UBadge
                :color="hasTrustline(pool) ? 'green' : 'amber'"
                variant="subtle"
                size="xs"
              >
                {{ hasTrustline(pool) ? '✓ Trustline ready' : '⚠ Needs trustline' }}
              </UBadge>
            </div>
          </div>
        </div>
      </button>
    </div>

    <!-- Pool Detail Modal -->
    <UModal v-model="showPoolModal">
      <div class="p-6" v-if="previewPool">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-title text-gray-900 dark:text-white">
            {{ previewPool.participantName }}'s Pool
          </h3>
          <UBadge v-if="isOwnPool(previewPool)" color="blue" variant="subtle">Your Pool</UBadge>
        </div>

        <div class="space-y-3 text-sm mb-6">
          <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-500">Pool Pair</span>
            <span class="font-semibold">XRP / {{ previewPool.tokenCurrency }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-500">Pool Account</span>
            <span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{ previewPool.ammAccount.slice(0,12) }}…{{ previewPool.ammAccount.slice(-6) }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-500">XRP Reserve</span>
            <span class="font-mono text-blue-600 dark:text-blue-400 font-semibold">{{ (Number(previewPool.xrpReserve) || 0).toFixed(4) }} XRP</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-500">{{ previewPool.tokenCurrency }} Reserve</span>
            <span class="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{{ (Number(previewPool.tokenReserve) || 0).toFixed(4) }} {{ previewPool.tokenCurrency }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-500">Spot Price</span>
            <span class="font-semibold">
              {{ previewPool.xrpReserve && previewPool.tokenReserve && Number(previewPool.xrpReserve) > 0
                ? ((Number(previewPool.tokenReserve) || 0) / (Number(previewPool.xrpReserve) || 1)).toFixed(4)
                : '—' }}
              {{ previewPool.tokenCurrency }} per XRP
            </span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-500">Trading Fee</span>
            <span class="font-semibold">{{ previewPool.tradingFee }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-500">Trustline</span>
            <UBadge :color="hasTrustline(previewPool) ? 'green' : 'amber'" variant="subtle" size="sm">
              {{ hasTrustline(previewPool) ? '✓ Already set' : '⚠ Will be created automatically' }}
            </UBadge>
          </div>
        </div>

        <UButton
          label="Select This Pool"
          color="primary"
          size="lg"
          block
          icon="i-heroicons-arrow-right"
          trailing
          @click="selectPool(previewPool)"
        />
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import API from '~/server/client'

const props = defineProps<{
  ownIssuerAddress?: string
  hasTrustline: (pool: any) => boolean
}>()

const emit = defineEmits<{
  (e: 'select', pool: any): void
}>()

const participantPools = ref<any[]>([])
const isLoadingPools = ref(false)
const showPoolModal = ref(false)
const previewPool = ref<any>(null)

function isOwnPool(pool: any): boolean {
  return !!(props.ownIssuerAddress && pool.tokenIssuer === props.ownIssuerAddress)
}

async function loadPools() {
  isLoadingPools.value = true
  try {
    participantPools.value = await API.getParticipantPools()
  } catch (e) {
    console.error('Failed to load pools:', e)
  } finally {
    isLoadingPools.value = false
  }
}

function openPoolModal(pool: any) {
  previewPool.value = pool
  showPoolModal.value = true
}

function selectPool(pool: any) {
  showPoolModal.value = false
  emit('select', pool)
}

onMounted(() => {
  loadPools()
})
</script>
