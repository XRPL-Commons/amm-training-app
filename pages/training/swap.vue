<template>
  <div class="w-full max-w-4xl mx-auto px-4 py-12">
    <div class="mb-8 text-center">
      <div class="text-blue-500 font-medium tracking-wider text-sm mb-2">STEP 4 OF 4</div>
      <h1 class="text-3xl font-title text-black dark:text-white mb-2">Swap on the AMM</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Trade your tokens directly against the AMM pool. Notice how the price moves based on your trade size!
      </p>
    </div>

    <!-- ─── Phase A: Pool Selector ─── -->
    <div v-if="swapPhase === 'select'">
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
                {{ Number(pool.xrpReserve).toFixed(2) }} XRP · {{ Number(pool.tokenReserve).toFixed(2) }} {{ pool.tokenCurrency }}
              </div>
              <div class="flex items-center justify-end gap-2 mt-1">
                <span class="text-xs text-gray-400">Fee {{ pool.tradingFee }}</span>
                <UBadge
                  :color="hasTrustlineForPool(pool) ? 'green' : 'amber'"
                  variant="subtle"
                  size="xs"
                >
                  {{ hasTrustlineForPool(pool) ? '✓ Trustline ready' : '⚠ Needs trustline' }}
                </UBadge>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- ─── Phase B: Trustline Setup ─── -->
    <div v-else-if="swapPhase === 'trustline'" class="max-w-md mx-auto">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
        <div class="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <Icon name="heroicons:link" class="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Setting Up Trustline</h2>
        <p class="text-sm text-gray-500 mb-6">
          To receive <strong>{{ selectedPool?.tokenCurrency }}</strong> from this pool, your wallet needs a trustline
          to the issuer. This is a one-time, automatic setup.
        </p>
        <ul class="space-y-3 text-left font-mono text-sm mb-6">
          <li class="flex items-center gap-3">
            <Icon v-if="trustlineStatus === 'submitting'" name="eos-icons:loading" class="w-5 h-5 text-blue-500 shrink-0" />
            <Icon v-else-if="trustlineStatus === 'done' || trustlineStatus === 'proceeding'" name="heroicons:check-circle" class="w-5 h-5 text-green-500 shrink-0" />
            <Icon v-else name="heroicons:clock" class="w-5 h-5 text-gray-400 shrink-0" />
            <span :class="trustlineStatus === 'submitting' ? 'text-gray-800 dark:text-gray-200' : trustlineStatus === 'done' ? 'text-gray-500' : 'text-gray-400'">
              Submitting TrustSet transaction...
            </span>
          </li>
          <li v-if="trustlineStatus === 'done' || trustlineStatus === 'proceeding'" class="flex items-center gap-3">
            <Icon v-if="trustlineStatus === 'proceeding'" name="eos-icons:loading" class="w-5 h-5 text-blue-500 shrink-0" />
            <Icon v-else name="heroicons:check-circle" class="w-5 h-5 text-green-500 shrink-0" />
            <span class="text-gray-800 dark:text-gray-200">Proceeding to swap...</span>
          </li>
        </ul>
        <div v-if="trustlineError" class="text-red-500 text-sm">{{ trustlineError }}</div>
      </div>
    </div>

    <!-- ─── Phase C: Swap UI ─── -->
    <div v-else-if="swapPhase === 'swap'">
      <!-- Change pool link -->
      <div class="flex items-center justify-between mb-4">
        <button class="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1" @click="swapPhase = 'select'">
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          Change Pool
        </button>
        <div v-if="selectedPool" class="text-sm text-gray-500">
          Trading against <strong class="text-gray-800 dark:text-white">{{ selectedPool.participantName }}'s Pool</strong>
          (XRP / {{ selectedPool.tokenCurrency }})
        </div>
      </div>

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
                <UInput v-model="payAmount" type="number" placeholder="0.0" class="flex-1" size="xl" />
                <USelect v-model="payCurrency" :options="['XRP', selectedPool?.tokenCurrency].filter(Boolean)" class="w-32" size="xl" />
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
    </div>
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
          <span class="font-mono text-blue-600 dark:text-blue-400 font-semibold">{{ Number(previewPool.xrpReserve).toFixed(4) }} XRP</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <span class="text-gray-500">{{ previewPool.tokenCurrency }} Reserve</span>
          <span class="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{{ Number(previewPool.tokenReserve).toFixed(4) }} {{ previewPool.tokenCurrency }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <span class="text-gray-500">Spot Price</span>
          <span class="font-semibold">
            {{ previewPool.xrpReserve && previewPool.tokenReserve
              ? (Number(previewPool.tokenReserve) / Number(previewPool.xrpReserve)).toFixed(4)
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
          <UBadge :color="hasTrustlineForPool(previewPool) ? 'green' : 'amber'" variant="subtle" size="sm">
            {{ hasTrustlineForPool(previewPool) ? '✓ Already set' : '⚠ Will be created automatically' }}
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Client, Wallet, PaymentFlags } from 'xrpl'
import API from '~/server/client'

definePageMeta({
  middleware: 'training-client'
})

// ─── Types ───
interface ParticipantPool {
  participantName: string
  participantAddress: string
  tokenCurrency: string
  tokenCurrencyRaw: string
  tokenIssuer: string
  ammAccount: string
  xrpReserve: string
  tokenReserve: string
  tradingFee: string
}

const { userWallet, issuerWallet } = useTrainingProgress()
const { walletTokens } = useWallet()
const router = useRouter()
const config = useRuntimeConfig()

let xrplClient: Client | null = null

// ─── Phase management ───
const swapPhase = ref<'select' | 'trustline' | 'swap'>('select')
const selectedPool = ref<ParticipantPool | null>(null)
const previewPool = ref<ParticipantPool | null>(null)
const showPoolModal = ref(false)

// ─── Pool list (Phase A) ───
const participantPools = ref<ParticipantPool[]>([])
const isLoadingPools = ref(false)

// ─── Trustline (Phase B) ───
const trustlineStatus = ref<'idle' | 'submitting' | 'done' | 'proceeding'>('idle')
const trustlineError = ref('')

// ─── Swap (Phase C) ───
const payAmount = ref('')
const payCurrency = ref('XRP')
const receiveCurrency = computed(() => payCurrency.value === 'XRP' ? selectedPool.value?.tokenCurrency || '' : 'XRP')

const payBalance = ref('0.0')
const receiveBalance = ref('0.0')

const poolData = ref<any>(null)
const isLoadingPool = ref(false)

const isSwapping = ref(false)
const status = ref({ complete: false, error: false })
const errorMessage = ref('')

let fetchTimeout: any = null

// ─── Helpers ───
function isOwnPool(pool: ParticipantPool): boolean {
  return !!(issuerWallet.value?.address && pool.tokenIssuer === issuerWallet.value.address)
}

function hasTrustlineForPool(pool: ParticipantPool): boolean {
  return walletTokens.value.some(t =>
    (t.currency === pool.tokenCurrencyRaw || t.currency === pool.tokenCurrency) &&
    t.issuer === pool.tokenIssuer &&
    !t.isLPToken
  )
}

const formatReserve = (amountObj: any) => {
  if (typeof amountObj === 'string') return (Number(amountObj) / 1000000).toFixed(2)
  if (amountObj?.value) return Number(amountObj.value).toFixed(2)
  return '0'
}

const spotPrice = computed(() => {
  if (!poolData.value) return '0.00'
  const xrpReserve = Number(poolData.value.amount) / 1000000
  const tokenReserve = Number(poolData.value.amount2?.value || 0)
  if (xrpReserve > 0) return (tokenReserve / xrpReserve).toFixed(4)
  return '0.00'
})

const estimatedReceive = computed(() => {
  if (!poolData.value || !payAmount.value || Number(payAmount.value) <= 0) return '0.00'
  const xrpReserve = Number(poolData.value.amount) / 1000000
  const tokenReserve = Number(poolData.value.amount2?.value || 0)
  const input = Number(payAmount.value)
  let inputReserve, outputReserve
  if (payCurrency.value === 'XRP') { inputReserve = xrpReserve; outputReserve = tokenReserve }
  else { inputReserve = tokenReserve; outputReserve = xrpReserve }
  const output = (input * outputReserve) / (inputReserve + input)
  return output.toFixed(4)
})

const isValid = computed(() => Number(payAmount.value) > 0 && Number(payAmount.value) <= Number(payBalance.value))

const swapCurrencies = () => { payCurrency.value = receiveCurrency.value }

// ─── XRPL client ───
const getClient = async () => {
  if (!xrplClient) xrplClient = new Client(config.public.wssExplorer || 'wss://s.altnet.rippletest.net:51233')
  if (!xrplClient.isConnected()) await xrplClient.connect()
  return xrplClient
}

// ─── Phase A: Load pools ───
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

function openPoolModal(pool: ParticipantPool) {
  previewPool.value = pool
  showPoolModal.value = true
}

// ─── Select pool → Phase B or C ───
async function selectPool(pool: ParticipantPool) {
  showPoolModal.value = false
  selectedPool.value = pool
  payCurrency.value = 'XRP'

  if (hasTrustlineForPool(pool)) {
    swapPhase.value = 'swap'
    await fetchSwapState()
  } else {
    swapPhase.value = 'trustline'
    await createTrustline(pool)
  }
}

// ─── Phase B: Create trustline ───
async function createTrustline(pool: ParticipantPool) {
  if (!userWallet.value) return
  trustlineError.value = ''
  trustlineStatus.value = 'submitting'

  try {
    const client = await getClient()
    const user = Wallet.fromSeed(userWallet.value.seed)
    await client.submitAndWait({
      TransactionType: 'TrustSet',
      Account: user.address,
      LimitAmount: {
        currency: pool.tokenCurrencyRaw || pool.tokenCurrency,
        issuer: pool.tokenIssuer,
        value: '1000000000'
      }
    }, { autofill: true, wallet: user })

    trustlineStatus.value = 'proceeding'
    await new Promise(resolve => setTimeout(resolve, 800))
    swapPhase.value = 'swap'
    await fetchSwapState()
  } catch (err: any) {
    trustlineError.value = err.message || 'TrustSet failed.'
    trustlineStatus.value = 'idle'
  }
}

// ─── Phase C: Fetch swap state ───
async function fetchSwapState() {
  if (!userWallet.value || !selectedPool.value) return
  isLoadingPool.value = true

  try {
    const client = await getClient()
    const userAddress = userWallet.value.address
    const pool = selectedPool.value

    const accountInfo = await client.request({ command: 'account_info', account: userAddress })
    const xrpBal = (Number(accountInfo.result.account_data.Balance) / 1000000).toFixed(2)

    const lines = await client.request({ command: 'account_lines', account: userAddress })
    const tokenLine = lines.result.lines.find((l: any) =>
      (l.currency === pool.tokenCurrencyRaw || l.currency === pool.tokenCurrency) && l.account === pool.tokenIssuer
    )
    const tokenBal = tokenLine ? Number(tokenLine.balance).toFixed(2) : '0.00'

    if (payCurrency.value === 'XRP') { payBalance.value = xrpBal; receiveBalance.value = tokenBal }
    else { payBalance.value = tokenBal; receiveBalance.value = xrpBal }

    try {
      const ammInfo = await client.request({
        command: 'amm_info',
        amm_account: pool.ammAccount
      })
      if (ammInfo.result.amm) poolData.value = ammInfo.result.amm
    } catch { poolData.value = null }
  } catch (err) {
    console.error('Fetch swap state error:', err)
  } finally {
    isLoadingPool.value = false
  }
}

watch(payCurrency, () => {
  if (fetchTimeout) clearTimeout(fetchTimeout)
  fetchTimeout = setTimeout(() => fetchSwapState(), 300)
})

// ─── Execute Swap ───
async function executeSwap() {
  if (!userWallet.value || !selectedPool.value) return
  isSwapping.value = true
  status.value.error = false
  status.value.complete = false
  errorMessage.value = ''

  try {
    const client = await getClient()
    const user = Wallet.fromSeed(userWallet.value.seed)
    const amountNum = Number(payAmount.value)
    const estOut = Number(estimatedReceive.value)
    const pool = selectedPool.value

    const txjson: any = {
      TransactionType: 'Payment',
      Account: user.address,
      Destination: user.address,
      Flags: PaymentFlags.tfPartialPayment
    }

    if (payCurrency.value === 'XRP') {
      txjson.SendMax = Math.floor(amountNum * 1000000).toString()
      txjson.Amount = { currency: pool.tokenCurrencyRaw || pool.tokenCurrency, issuer: pool.tokenIssuer, value: Number((estOut * 2).toFixed(6)).toString() }
      txjson.DeliverMin = { currency: pool.tokenCurrencyRaw || pool.tokenCurrency, issuer: pool.tokenIssuer, value: Number((estOut * 0.95).toFixed(6)).toString() }
    } else {
      txjson.SendMax = { currency: pool.tokenCurrencyRaw || pool.tokenCurrency, issuer: pool.tokenIssuer, value: amountNum.toString() }
      txjson.Amount = Math.floor(estOut * 2 * 1000000).toString()
      txjson.DeliverMin = Math.floor(estOut * 0.95 * 1000000).toString()
    }

    const pathFindRequest: any = {
      command: 'ripple_path_find',
      source_account: user.address,
      destination_account: user.address,
      send_max: txjson.SendMax
    }

    if (typeof txjson.Amount === 'string') {
      pathFindRequest.destination_amount = '-1'
    } else {
      pathFindRequest.destination_amount = { currency: txjson.Amount.currency, issuer: txjson.Amount.issuer, value: '-1' }
    }

    const pathFind = await client.request(pathFindRequest)
    if (pathFind.result.alternatives?.length > 0) {
      txjson.Paths = pathFind.result.alternatives[0].paths_computed
    }

    await client.submitAndWait(txjson, { autofill: true, wallet: user })
    status.value.complete = true
    payAmount.value = ''
    await fetchSwapState()
  } catch (err: any) {
    status.value.error = true
    errorMessage.value = err.message || 'Swap failed.'
  } finally {
    isSwapping.value = false
  }
}

const completeTraining = () => {
  alert('Congratulations! You have completed the AMM Training.')
  const { resetProgress } = useTrainingProgress()
  resetProgress()
  router.push('/')
}

onMounted(() => { loadPools() })

onUnmounted(() => {
  if (xrplClient?.isConnected()) xrplClient.disconnect()
})
</script>
