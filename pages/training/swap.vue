<template>
  <div class="w-full max-w-4xl mx-auto px-4 py-12">
    <div class="mb-8 text-center">
      <div class="text-blue-500 font-medium tracking-wider text-sm mb-2">STEP 4 OF 4</div>
      <h1 class="text-3xl font-title text-black dark:text-white mb-2">Swap on the AMM</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Trade your tokens directly against the AMM pool. Notice how the price moves based on your trade size!
      </p>
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
              <USelect v-model="payCurrency" :options="['XRP', customToken?.currency]" class="w-32" size="xl" />
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
        <!-- Abstract background shapes -->
        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 bg-green-500 rounded-full blur-3xl opacity-20 -ml-10 -mb-10"></div>

        <div class="relative z-10">
          <h2 class="text-xl font-semibold mb-6">AMM Pool Stats</h2>
          <div v-if="isLoadingPool" class="flex items-center gap-2 text-gray-400">
            <Icon name="eos-icons:loading" class="w-5 h-5" /> Loading pool data...
          </div>
          <div v-else-if="poolData" class="space-y-6">
            <div class="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div class="text-sm text-gray-400">Pool Pair</div>
              <div class="font-bold">XRP / {{ customToken?.currency }}</div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-gray-800 rounded-lg text-center">
                <div class="text-sm text-gray-400 mb-1">XRP Reserve</div>
                <div class="font-mono text-lg text-blue-400">{{ formatReserve(poolData.amount) }}</div>
              </div>
              <div class="p-4 bg-gray-800 rounded-lg text-center">
                <div class="text-sm text-gray-400 mb-1">{{ customToken?.currency }} Reserve</div>
                <div class="font-mono text-lg text-green-400">{{ formatReserve(poolData.amount2) }}</div>
              </div>
            </div>

            <div class="p-4 bg-gray-800 rounded-lg text-center">
              <div class="text-sm text-gray-400 mb-1">Current Spot Price</div>
              <div class="font-bold text-xl">{{ spotPrice }} {{ customToken?.currency }} per XRP</div>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Client, Wallet, PaymentFlags } from 'xrpl'

definePageMeta({
  middleware: 'training-client'
})

const { userWallet, customToken } = useTrainingProgress()
const router = useRouter()
const config = useRuntimeConfig()

let xrplClient: Client | null = null

const payAmount = ref('')
const payCurrency = ref('XRP')
const receiveCurrency = computed(() => payCurrency.value === 'XRP' ? customToken.value?.currency : 'XRP')

const payBalance = ref('0.0')
const receiveBalance = ref('0.0')

const poolData = ref<any>(null)
const isLoadingPool = ref(true)

const isSwapping = ref(false)
const status = ref({
  complete: false,
  error: false
})
const errorMessage = ref('')

let fetchTimeout: any = null

const formatReserve = (amountObj: any) => {
  if (typeof amountObj === 'string') {
    return (Number(amountObj) / 1000000).toFixed(2)
  } else if (amountObj && amountObj.value) {
    return Number(amountObj.value).toFixed(2)
  }
  return '0'
}

const spotPrice = computed(() => {
  if (!poolData.value) return '0.00'
  const xrpReserve = Number(poolData.value.amount) / 1000000
  const tokenReserve = Number(poolData.value.amount2.value)
  if (xrpReserve > 0) return (tokenReserve / xrpReserve).toFixed(4)
  return '0.00'
})

const estimatedReceive = computed(() => {
  if (!poolData.value || !payAmount.value || Number(payAmount.value) <= 0) return '0.00'
  
  const xrpReserve = Number(poolData.value.amount) / 1000000
  const tokenReserve = Number(poolData.value.amount2.value)
  const input = Number(payAmount.value)

  let inputReserve, outputReserve;
  if (payCurrency.value === 'XRP') {
    inputReserve = xrpReserve
    outputReserve = tokenReserve
  } else {
    inputReserve = tokenReserve
    outputReserve = xrpReserve
  }

  const output = (input * outputReserve) / (inputReserve + input)
  return output.toFixed(4)
})

const isValid = computed(() => {
  return Number(payAmount.value) > 0 && Number(payAmount.value) <= Number(payBalance.value)
})

const swapCurrencies = () => {
  payCurrency.value = receiveCurrency.value
}

const getClient = async () => {
  if (!xrplClient) {
    xrplClient = new Client(config.public.wssExplorer || 'wss://s.altnet.rippletest.net:51233')
  }
  if (!xrplClient.isConnected()) {
    await xrplClient.connect()
  }
  return xrplClient
}

const fetchState = async () => {
  if (!userWallet.value || !customToken.value) return
  isLoadingPool.value = true
  
  try {
    const client = await getClient()
    const userAddress = userWallet.value.address
    const token = customToken.value

    const accountInfo = await client.request({ command: 'account_info', account: userAddress })
    const xrpBal = (Number(accountInfo.result.account_data.Balance) / 1000000).toFixed(2)

    const lines = await client.request({ command: 'account_lines', account: userAddress })
    const tokenLine = lines.result.lines.find((l: any) => l.currency === token.currency && l.account === token.issuer)
    const tokenBal = tokenLine ? Number(tokenLine.balance).toFixed(2) : '0.00'

    if (payCurrency.value === 'XRP') {
      payBalance.value = xrpBal
      receiveBalance.value = tokenBal
    } else {
      payBalance.value = tokenBal
      receiveBalance.value = xrpBal
    }

    try {
      const ammInfo = await client.request({
        command: 'amm_info',
        asset: { currency: 'XRP' },
        asset2: { currency: token.currency, issuer: token.issuer }
      })
      
      if (ammInfo.result.amm) {
        poolData.value = ammInfo.result.amm
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('actNotFound') || e.message.includes('Account not found') || e.message.includes('Account not found.'))) {
        poolData.value = null // AMM simply doesn't exist yet
      } else {
        console.error("AMM Info Error", e)
      }
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('actNotFound') || err.message.includes('Account not found') || err.message.includes('Account not found.'))) {
      // User account isn't fully funded yet
    } else {
      console.error("Fetch State Error", err)
    }
  } finally {
    isLoadingPool.value = false
  }
}

watch(payCurrency, () => {
  // Debounce state fetches to prevent rapid toggling race conditions
  if (fetchTimeout) clearTimeout(fetchTimeout)
  fetchTimeout = setTimeout(() => {
    fetchState()
  }, 300)
})

onMounted(() => {
  fetchState()
})

onUnmounted(() => {
  if (xrplClient && xrplClient.isConnected()) {
    xrplClient.disconnect()
  }
})

const executeSwap = async () => {
  if (!userWallet.value || !customToken.value) return
  isSwapping.value = true
  status.value.error = false
  status.value.complete = false
  errorMessage.value = ''

  try {
    const client = await getClient()
    const user = Wallet.fromSeed(userWallet.value.seed)
    const amountNum = Number(payAmount.value)
    const estOut = Number(estimatedReceive.value)
    const token = customToken.value

    const txjson: any = {
      TransactionType: "Payment",
      Account: user.address,
      Destination: user.address,
      Flags: PaymentFlags.tfPartialPayment
    }

    if (payCurrency.value === 'XRP') {
      txjson.SendMax = Math.floor(amountNum * 1000000).toString()
      txjson.Amount = {
        currency: token.currency,
        issuer: token.issuer,
        value: Number((estOut * 2).toFixed(6)).toString()
      }
      txjson.DeliverMin = {
        currency: token.currency,
        issuer: token.issuer,
        value: Number((estOut * 0.95).toFixed(6)).toString()
      }
    } else {
      txjson.SendMax = {
        currency: token.currency,
        issuer: token.issuer,
        value: amountNum.toString()
      }
      txjson.Amount = Math.floor(estOut * 2 * 1000000).toString()
      txjson.DeliverMin = Math.floor(estOut * 0.95 * 1000000).toString()
    }

    // Pathfinding to avoid tecPATH_DRY
    const pathFindRequest: any = {
      command: 'ripple_path_find',
      source_account: user.address,
      destination_account: user.address,
      send_max: txjson.SendMax
    }

    if (typeof txjson.Amount === 'string') {
      pathFindRequest.destination_amount = "-1"
    } else {
      pathFindRequest.destination_amount = {
        currency: txjson.Amount.currency,
        issuer: txjson.Amount.issuer,
        value: "-1"
      }
    }

    const pathFind = await client.request(pathFindRequest)

    if (pathFind.result.alternatives && pathFind.result.alternatives.length > 0) {
      txjson.Paths = pathFind.result.alternatives[0].paths_computed
    }

    await client.submitAndWait(txjson, { autofill: true, wallet: user })

    status.value.complete = true
    payAmount.value = ''
    await fetchState()

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
</script>
