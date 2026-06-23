<template>
  <div class="w-full max-w-3xl mx-auto px-4 py-12">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <ColoredAddress :address="xrplAddress" variant="bars" />
        <div>
          <h1 class="text-2xl font-title text-black dark:text-white">
            {{ currentUser?.name || 'Your Profile' }}
          </h1>
          <div class="flex items-center gap-2 mt-1">
            <div class="text-xs text-gray-500 dark:text-gray-400">Step {{ currentStep }} of 4</div>
            <div class="h-1.5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 rounded-full transition-all duration-500"
                :style="{ width: `${(currentStep / 4) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-arrow-path"
          color="gray"
          variant="ghost"
          size="sm"
          :loading="walletDataLoading"
          @click="handleRefresh"
        >
          Refresh
        </UButton>
        <UButton
          icon="i-heroicons-arrow-right-on-rectangle"
          color="red"
          variant="soft"
          size="sm"
          @click="handleDisconnect"
        >
          Disconnect
        </UButton>
      </div>
    </div>

    <!-- Section 1: Wallet Balances -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <!-- Treasury Wallet -->
      <div v-if="issuerWallet" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <Icon name="heroicons:building-library" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div class="text-xs text-gray-500 uppercase font-semibold tracking-wide">Treasury</div>
            <div class="text-xs text-gray-400">Issuer Wallet</div>
          </div>
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          <span v-if="walletDataLoading" class="inline-flex items-center gap-1 text-base text-gray-400">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Loading...
          </span>
          <span v-else>{{ treasuryXrpBalance }} <span class="text-sm font-normal text-gray-400">XRP</span></span>
        </div>
        <div class="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span class="font-mono text-xs text-gray-500 truncate">{{ issuerWallet.address }}</span>
          <UButton color="gray" variant="ghost" icon="i-heroicons-clipboard-document" size="xs" @click="copyAddress(issuerWallet.address)" />
        </div>
      </div>

      <!-- User Wallet -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Icon name="heroicons:user" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div class="text-xs text-gray-500 uppercase font-semibold tracking-wide">User Wallet</div>
            <div class="text-xs text-gray-400">Receiver</div>
          </div>
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          <span v-if="walletDataLoading" class="inline-flex items-center gap-1 text-base text-gray-400">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Loading...
          </span>
          <span v-else>{{ walletXrpBalance }} <span class="text-sm font-normal text-gray-400">XRP</span></span>
        </div>
        <div class="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span class="font-mono text-xs text-gray-500 truncate">{{ xrplAddress }}</span>
          <UButton color="gray" variant="ghost" icon="i-heroicons-clipboard-document" size="xs" @click="copyAddress(xrplAddress)" />
        </div>
      </div>
    </div>

    <!-- Section 2: Token Holdings (trustlines) -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm mb-6">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Token Holdings</h2>

      <div v-if="walletDataLoading" class="text-sm text-gray-400 flex items-center gap-2">
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        Loading balances...
      </div>
      <div v-else-if="regularTokens.length === 0" class="text-sm text-gray-400 italic">
        No token trustlines yet. Complete Step 2 to issue your token.
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="token in regularTokens"
          :key="token.issuer + token.currency"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300">{{ decodeCurrency(token.currency).slice(0, 2) }}</span>
            </div>
            <div>
              <div class="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                {{ decodeCurrency(token.currency) }}
                <UBadge
                  v-if="issuerWallet && token.issuer === issuerWallet.address"
                  color="blue"
                  variant="subtle"
                  size="xs"
                >Your Token</UBadge>
                <UBadge v-else color="gray" variant="subtle" size="xs">Trustline</UBadge>
              </div>
              <div class="text-xs text-gray-400 font-mono">{{ token.issuer.slice(0, 12) }}…</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-sm text-gray-900 dark:text-white">{{ Number(token.amount).toLocaleString() }}</div>
            <div class="text-xs text-gray-400">Limit: {{ Number(token.limit).toLocaleString() }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: LP Token Positions -->
    <div v-if="lpTokens.length > 0" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm mb-6">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Liquidity Positions</h2>
      <div class="space-y-4">
        <div
          v-for="lp in lpTokensWithPools"
          :key="lp.currency"
          class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="font-semibold text-gray-900 dark:text-white text-sm">
              {{ lp.poolInfo ? `${lp.poolInfo.asset1.currency} / ${lp.poolInfo.asset2.currency} Pool` : 'AMM Pool' }}
            </div>
            <UBadge color="purple" variant="subtle" size="xs">LP Token</UBadge>
          </div>
          <div v-if="lp.poolInfo" class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-white dark:bg-gray-800 rounded p-2 text-center">
              <div class="text-xs text-gray-400 mb-1">{{ lp.poolInfo.asset1.currency }} Reserve</div>
              <div class="font-mono font-bold text-blue-500">{{ Number(lp.poolInfo.asset1.amount).toFixed(2) }}</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded p-2 text-center">
              <div class="text-xs text-gray-400 mb-1">{{ lp.poolInfo.asset2.currency }} Reserve</div>
              <div class="font-mono font-bold text-emerald-500">{{ Number(lp.poolInfo.asset2.amount).toFixed(2) }}</div>
            </div>
            <div class="col-span-2 bg-white dark:bg-gray-800 rounded p-2 flex justify-between items-center">
              <span class="text-xs text-gray-400">Trading Fee</span>
              <span class="font-semibold text-xs">{{ lp.poolInfo.tradingFee }}</span>
            </div>
          </div>
          <div class="mt-2 text-xs text-gray-500">Your LP tokens: {{ Number(lp.amount).toLocaleString() }}</div>
        </div>
      </div>
    </div>

    <!-- Section 4: My AMM Pool -->
    <div v-if="customToken && ownPoolData" class="bg-gray-900 rounded-xl p-5 shadow-sm mb-6 text-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10" />
      <div class="absolute bottom-0 left-0 w-32 h-32 bg-green-500 rounded-full blur-3xl opacity-20 -ml-10 -mb-10" />
      <div class="relative z-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">My AMM Pool</h2>
          <UBadge color="blue" variant="solid" size="xs">XRP / {{ customToken.currency.length <= 4 ? customToken.currency : customToken.currency.slice(0, 4) + '…' }}</UBadge>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-400 mb-1">XRP Reserve</div>
            <div class="font-mono font-bold text-blue-400">{{ formatReserve(ownPoolData.amount) }}</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-400 mb-1">{{ customToken.currency }} Reserve</div>
            <div class="font-mono font-bold text-emerald-400">{{ formatReserve(ownPoolData.amount2) }}</div>
          </div>
        </div>
        <div class="bg-gray-800 rounded-lg p-3 flex justify-between items-center text-sm">
          <span class="text-gray-400">Spot Price</span>
          <span class="font-bold">{{ ownSpotPrice }} {{ customToken.currency }} per XRP</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Client } from 'xrpl'

definePageMeta({
  layout: 'default'
})

const { xrplAddress, currentUser, walletXrpBalance, treasuryXrpBalance, walletDataLoading, walletTokens, refreshWalletData, disconnectWallet } = useWallet()
const { issuerWallet, customToken, currentStep } = useTrainingProgress()
const config = useRuntimeConfig()
const router = useRouter()
const toast = useToast()

// Pool data for own pool
const ownPoolData = ref<any>(null)
const lpTokensWithPools = ref<any[]>([])

// Separate regular tokens from LP tokens
const regularTokens = computed(() => walletTokens.value.filter(t => !t.isLPToken))
const lpTokens = computed(() => walletTokens.value.filter(t => t.isLPToken))

function decodeCurrency(currency: string): string {
  if (currency.length <= 4) return currency
  if (currency.length === 40 && currency.startsWith('03')) return 'LP'
  // Decode hex currency
  let str = ''
  for (let i = 0; i < currency.length; i += 2) {
    const code = parseInt(currency.substr(i, 2), 16)
    if (code > 31 && code < 127) str += String.fromCharCode(code)
  }
  return str.replace(/\0/g, '').trim() || currency.slice(0, 6)
}

function formatReserve(amountObj: any): string {
  if (typeof amountObj === 'string') return (Number(amountObj) / 1_000_000).toFixed(2)
  if (amountObj?.value) return Number(amountObj.value).toFixed(2)
  return '0'
}

const ownSpotPrice = computed(() => {
  if (!ownPoolData.value) return '0.00'
  const xrpReserve = Number(ownPoolData.value.amount) / 1_000_000
  const tokenReserve = Number(ownPoolData.value.amount2?.value || 0)
  if (xrpReserve > 0) return (tokenReserve / xrpReserve).toFixed(4)
  return '0.00'
})

async function loadOwnPoolData() {
  if (!customToken.value) return
  try {
    const client = new Client(config.public.wssExplorer as string || 'wss://s.altnet.rippletest.net:51233')
    await client.connect()
    try {
      const ammInfo = await client.request({
        command: 'amm_info',
        asset: { currency: customToken.value.currency, issuer: customToken.value.issuer },
        asset2: { currency: 'XRP' }
      })
      ownPoolData.value = ammInfo.result.amm
    } catch {
      ownPoolData.value = null
    } finally {
      await client.disconnect()
    }
  } catch (e) {
    console.warn('Could not load own pool data:', e)
  }
}

async function loadLpPoolDetails() {
  if (lpTokens.value.length === 0) return
  const results = await Promise.allSettled(
    lpTokens.value.map(async (lp) => {
      try {
        const client = new Client(config.public.wssExplorer as string || 'wss://s.altnet.rippletest.net:51233')
        await client.connect()
        try {
          const ammInfo = await client.request({ command: 'amm_info', amm_account: lp.issuer })
          const amm = ammInfo.result.amm
          return {
            ...lp,
            poolInfo: {
              asset1: { currency: 'XRP', amount: (parseInt(amm.amount as string) / 1e6).toFixed(6) },
              asset2: { currency: amm.amount2 && typeof amm.amount2 === 'object' ? amm.amount2.currency : '?', amount: amm.amount2 && typeof amm.amount2 === 'object' ? amm.amount2.value : '0' },
              tradingFee: (amm.trading_fee / 1000).toFixed(3) + '%',
              account: amm.account
            }
          }
        } finally {
          await client.disconnect()
        }
      } catch {
        return { ...lp, poolInfo: null }
      }
    })
  )
  lpTokensWithPools.value = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value)
}

function copyAddress(address: string) {
  navigator.clipboard.writeText(address)
  toast.add({ title: 'Address copied', icon: 'i-heroicons-clipboard-document-check' })
}

async function handleRefresh() {
  await refreshWalletData()
  await loadOwnPoolData()
  await loadLpPoolDetails()
}

function handleDisconnect() {
  disconnectWallet()
  const { resetProgress } = useTrainingProgress()
  resetProgress()
  router.push('/')
}

onMounted(async () => {
  await refreshWalletData()
  await loadOwnPoolData()
  await loadLpPoolDetails()
})
</script>
