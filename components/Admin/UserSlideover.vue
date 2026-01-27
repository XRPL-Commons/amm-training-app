<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-md' }">
    <div class="h-full flex flex-col">
      <!-- Fixed Header -->
      <div class="p-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-title text-gray-800 dark:text-white">{{ user?.name }}</h2>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
        </div>
        <div class="flex items-center gap-2">
          <ColoredAddress v-if="user?.xrplAddress" :address="user.xrplAddress" variant="boxes" />
          <UButton
            v-if="user?.xrplAddress"
            color="gray"
            variant="ghost"
            icon="i-heroicons-clipboard-document"
            size="xs"
            @click="copyAddress"
          />
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="p-6 pt-4 flex-1 overflow-y-auto">
        <!-- Account Info -->
      <div class="mb-6" v-if="isDataForCurrentUser && accountInfo">
        <div class="text-xs text-gray-500 uppercase mb-2">XRP Balance</div>
        <div class="text-2xl font-bold text-gray-800 dark:text-white">
          {{ formatXrp(accountInfo.result?.account_data?.Balance) }} XRP
        </div>
      </div>

      <!-- Public Key -->
      <div class="mb-6" v-if="isDataForCurrentUser">
        <div class="text-xs text-gray-500 uppercase mb-2">Public Key</div>
        <div v-if="pubkeyLoading" class="text-gray-500">
          <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
        </div>
        <div v-else-if="pubkey" class="flex items-center gap-2">
          <span class="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{{ pubkey }}</span>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-clipboard-document"
            size="xs"
            @click="copyPubKey"
          />
        </div>
        <div v-else class="text-xs text-gray-400">No public key found (no signed transactions)</div>
      </div>

      <!-- Tokens -->
      <div>
        <div class="text-xs text-gray-500 uppercase mb-3">Tokens</div>

        <div v-if="!isDataForCurrentUser || (loading && !initialized)" class="text-center py-8 text-gray-500">
          <Icon name="heroicons:arrow-path" class="w-6 h-6 animate-spin" />
        </div>

        <div v-else-if="initialized && regularTokens.length === 0" class="text-center py-8 text-gray-500">
          No tokens found
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="token in regularTokens"
            :key="`${token.currency}-${token.issuer}`"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
          >
            <!-- Token Content -->
            <div class="p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-800 dark:text-white">{{ token.currency }}</span>
                <div class="text-gray-600 dark:text-gray-400">{{ formatAmount(token.amount) }}</div>
              </div>
              <ColoredAddress :address="token.issuer" variant="boxes" />
            </div>
            <!-- Connected User's Trustline -->
            <div class="mx-3 pt-2 pb-3 border-t border-blue-500/30 flex items-center justify-between">
              <span class="text-xs text-gray-500">
                Your trustline limit: {{ getMyTrustlineLimit(token) }}
              </span>
              <UButton
                size="xs"
                color="primary"
                variant="ghost"
                :icon="getMyTrustline(token) ? 'i-heroicons-pencil-square' : 'i-heroicons-plus'"
                @click="openTrustlineModal(token)"
              >
                {{ getMyTrustline(token) ? 'Edit' : 'Add' }}
              </UButton>
            </div>
            <!-- Token Footer with AMM button -->
            <div v-if="token.hasAmm" class="flex gap-2 px-3 py-2 bg-primary-500/10 border-t border-primary-500/20">
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-path-rounded-square"
                @click="$emit('viewAmm', token)"
              >
                AMM
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- LP Tokens / Pool Positions -->
      <div v-if="isDataForCurrentUser && lpTokensWithPool.length > 0" class="mt-6">
        <div class="text-xs text-gray-500 uppercase mb-3">Pool Positions</div>
        <div class="space-y-2">
          <div
            v-for="lp in lpTokensWithPool"
            :key="`${lp.currency}-${lp.issuer}`"
            class="bg-purple-500/10 border border-purple-500/20 rounded-lg overflow-hidden"
          >
            <!-- LP Content -->
            <div class="p-3">
              <div class="flex items-center justify-between mb-2">
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
              <ColoredAddress :address="lp.issuer" variant="boxes" />
            </div>
            <!-- LP Footer -->
            <div v-if="lp.poolInfo" class="flex gap-2 px-3 py-2 bg-purple-500/10 border-t border-purple-500/20">
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

      <!-- Fixed Footer -->
      <div class="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 flex justify-end">
        <UTooltip text="Refresh">
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-path"
            @click="loadData"
            :loading="loading"
          />
        </UTooltip>
      </div>
    </div>

    <!-- Trustline Limit Modal -->
    <UModal v-model="showTrustlineModal">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-title text-gray-800 dark:text-white">
            Set Trustline Limit
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showTrustlineModal = false" />
        </div>
        <div v-if="editingToken" class="mb-4">
          <div class="text-sm text-gray-500 mb-1">{{ editingToken.currency }}</div>
          <div class="mb-2">
            <ColoredAddress :address="editingToken.issuer" />
          </div>
          <div class="text-xs text-gray-400 mb-4">
            Current limit: {{ getMyTrustlineLimit(editingToken) }}
          </div>
          <UFormGroup label="New Limit" :hint="formatLimitHint(newTrustlineLimit)">
            <UInput
              v-model="newTrustlineLimit"
              type="text"
              placeholder="Enter new limit amount"
              size="lg"
            />
          </UFormGroup>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <UButton color="gray" variant="ghost" @click="showTrustlineModal = false">
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="confirmSetTrustline"
            :loading="trustlineLoading"
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

const toast = useToast()
const { cache: detailsCache, loadingAddresses, loadDetails } = useUserDetails()
const { getTrustlineFor, walletDataInitialized, refreshWalletData, xrplAddress: connectedAddress, userToken: connectedUserToken } = useWallet()

// Public key state
const pubkey = ref<string | null>(null)
const pubkeyLoading = ref(false)

// Trustline modal state
const showTrustlineModal = ref(false)
const editingToken = ref<Token | null>(null)
const newTrustlineLimit = ref('')
const trustlineLoading = ref(false)

// QR Modal state
const showQrModal = ref(false)
const qrCodeSrc = ref('')
const mobileUrl = ref('')

interface User {
  xrplAddress: string
  name: string
  createdAt?: string
}

interface Token {
  currency: string
  currencyRaw?: string // Original format from ledger (3-char or 40-char hex)
  issuer: string
  amount: string
  limit: string
  isLPToken: boolean
  hasAmm?: boolean
}

interface PoolInfo {
  asset1: { currency: string; currencyRaw?: string; amount: string; issuer?: string }
  asset2: { currency: string; currencyRaw?: string; amount: string; issuer?: string }
  tradingFee: string
  account: string
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

// Get cached details from composable (direct cache access for reactivity)
const details = computed(() => props.user ? detailsCache[props.user.xrplAddress] : null)
const loading = computed(() => props.user ? loadingAddresses.has(props.user.xrplAddress) : false)

// Derived state from cached details
const tokens = computed(() => details.value?.tokens || [])
const lpTokensWithPool = computed(() => details.value?.lpTokensWithPool || [])
const accountInfo = computed(() => details.value?.accountInfo || null)
const initialized = computed(() => details.value?.initialized || false)
const regularTokens = computed(() => tokens.value.filter(t => !t.isLPToken))

// Data is always for current user since it comes from cache keyed by address
const isDataForCurrentUser = computed(() => !!details.value)

watch(() => props.user, async (newUser) => {
  if (newUser) {
    await loadDetails(newUser.xrplAddress)
    fetchPubKey(newUser.xrplAddress)
  }
}, { immediate: true })

async function loadData() {
  if (!props.user) return
  await loadDetails(props.user.xrplAddress, true)
  fetchPubKey(props.user.xrplAddress)
}

async function fetchPubKey(xrplAddress: string) {
  pubkeyLoading.value = true
  pubkey.value = null
  try {
    const result = await API.getAccountPubKey({ xrplAddress })
    pubkey.value = result.pubkey
  } catch {
    pubkey.value = null
  } finally {
    pubkeyLoading.value = false
  }
}

function copyAddress() {
  if (props.user?.xrplAddress) {
    navigator.clipboard.writeText(props.user.xrplAddress)
    toast.add({ title: 'Address copied', icon: 'i-heroicons-clipboard-document-check' })
  }
}

function copyPubKey() {
  if (pubkey.value) {
    navigator.clipboard.writeText(pubkey.value)
    toast.add({ title: 'Public key copied', icon: 'i-heroicons-clipboard-document-check' })
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

function getNonXrpAsset(poolInfo: PoolInfo) {
  // Find the non-XRP asset to use for viewing the AMM
  if (poolInfo.asset1.currency !== 'XRP') {
    return {
      currency: poolInfo.asset1.currency,
      currencyRaw: poolInfo.asset1.currencyRaw,
      issuer: poolInfo.asset1.issuer || '',
      amount: poolInfo.asset1.amount
    }
  }
  return {
    currency: poolInfo.asset2.currency,
    currencyRaw: poolInfo.asset2.currencyRaw,
    issuer: poolInfo.asset2.issuer || '',
    amount: poolInfo.asset2.amount
  }
}

// Connected user's trustline helpers
function getMyTrustline(token: Token) {
  return getTrustlineFor(token.currency, token.issuer)
}

function getMyTrustlineLimit(token: Token): string {
  const trustline = getMyTrustline(token)
  return trustline ? formatAmount(trustline.limit) : 'None'
}

function openTrustlineModal(token: Token) {
  editingToken.value = token
  const existing = getMyTrustline(token)
  newTrustlineLimit.value = existing?.limit || '1000000000'
  showTrustlineModal.value = true
}

async function confirmSetTrustline() {
  if (!editingToken.value || !connectedAddress.value || !connectedUserToken.value) {
    toast.add({ title: 'Please sign in first', color: 'red' })
    return
  }

  trustlineLoading.value = true

  try {
    const payload = await API.createTrustline({
      userToken: connectedUserToken.value,
      account: connectedAddress.value,
      issuer: editingToken.value.issuer,
      currency: editingToken.value.currencyRaw || editingToken.value.currency,
      limit: newTrustlineLimit.value
    })

    showTrustlineModal.value = false
    qrCodeSrc.value = payload.refs.qr_png
    mobileUrl.value = payload.next.always
    showQrModal.value = true

    const ws = new WebSocket(payload.refs.websocket_status)
    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data)
      if (data.signed === true) {
        showQrModal.value = false
        ws.close()
        // Refresh wallet data after trustline change
        await refreshWalletData()
        toast.add({ title: 'Trustline updated', icon: 'i-heroicons-check-circle' })
      }
    }
  } catch (error) {
    console.error('Failed to create trustline:', error)
    toast.add({ title: 'Failed to create trustline', color: 'red' })
  } finally {
    trustlineLoading.value = false
  }
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
</script>
