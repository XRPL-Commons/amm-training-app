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
    <SwapPoolSelector
      v-if="swapPhase === 'select'"
      :own-issuer-address="issuerWallet?.address"
      :has-trustline="hasTrustlineForPool"
      @select="selectPool"
    />

    <!-- ─── Phase B: Trustline Setup ─── -->
    <SwapTrustlineSetup
      v-else-if="swapPhase === 'trustline'"
      :pool="selectedPool"
      :status="trustlineStatus"
      :error="trustlineError"
    />

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

      <SwapInterface
        :selected-pool="selectedPool"
        v-model:pay-amount="payAmount"
        v-model:pay-currency="payCurrency"
        :receive-currency="receiveCurrency"
        :pay-balance="payBalance"
        :receive-balance="receiveBalance"
        :pool-data="poolData"
        :is-loading-pool="isLoadingPool"
        :is-swapping="isSwapping"
        :status="status"
        :error-message="errorMessage"
        :estimated-receive="estimatedReceive"
        :spot-price="spotPrice"
        :is-valid="isValid"
        @swap-currencies="swapCurrencies"
        @execute-swap="executeSwap"
        @complete-training="completeTraining"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { Client, Wallet, PaymentFlags } from 'xrpl'

definePageMeta({
  middleware: 'training-client'
})

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

// Phase management
const swapPhase = ref<'select' | 'trustline' | 'swap'>('select')
const selectedPool = ref<ParticipantPool | null>(null)

// Trustline phase
const trustlineStatus = ref<'idle' | 'submitting' | 'done' | 'proceeding'>('idle')
const trustlineError = ref('')

// Swap phase
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

function hasTrustlineForPool(pool: ParticipantPool): boolean {
  return walletTokens.value.some(t =>
    (t.currency === pool.tokenCurrencyRaw || t.currency === pool.tokenCurrency) &&
    t.issuer === pool.tokenIssuer &&
    !t.isLPToken
  )
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

const getClient = async () => {
  if (!xrplClient) xrplClient = new Client(config.public.wssExplorer || 'wss://s.altnet.rippletest.net:51233')
  if (!xrplClient.isConnected()) await xrplClient.connect()
  return xrplClient
}

async function selectPool(pool: ParticipantPool) {
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
      const ammInfo = await client.request({ command: 'amm_info', amm_account: pool.ammAccount })
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

onUnmounted(() => {
  if (xrplClient?.isConnected()) xrplClient.disconnect()
})
</script>
