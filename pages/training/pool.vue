<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-12">
    <div class="mb-8 text-center">
      <div class="text-blue-500 font-medium tracking-wider text-sm mb-2">STEP 3 OF 4</div>
      <h1 class="text-3xl font-title text-black dark:text-white mb-2">Create an AMM Pool</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Supply liquidity by depositing XRP and your new token to create the market.
      </p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
      <div v-if="customToken" class="space-y-6">
        <div class="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
          <div>
            <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">Pool Pair</div>
            <div class="text-xl font-bold dark:text-white">XRP / {{ customToken.currency }}</div>
          </div>
          <Icon name="heroicons:arrows-right-left" class="w-8 h-8 text-blue-500" />
        </div>

        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount of XRP to Deposit</label>
            <span class="text-xs text-gray-500" v-if="!isLoadingBalances">Max: {{ (maxXrpBalance - 2).toFixed(2) }} (Reserving 2 for fees)</span>
          </div>
          <div class="relative">
            <UInput v-model="xrpAmount" type="number" placeholder="e.g. 100" size="lg" />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="text-gray-500 sm:text-sm">XRP</span>
            </div>
          </div>
        </div>
        
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount of {{ customToken.currency }} to Deposit</label>
            <span class="text-xs text-gray-500" v-if="!isLoadingBalances">Max: {{ maxTokenBalance.toFixed(2) }}</span>
          </div>
          <div class="relative">
            <UInput v-model="tokenAmount" type="number" placeholder="e.g. 1000" size="lg" />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="text-gray-500 sm:text-sm">{{ customToken.currency }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-center border border-gray-200 dark:border-gray-700">
          <span class="text-gray-500">Initial Price:</span>
          <span class="font-bold ml-2">1 XRP = {{ priceRatio }} {{ customToken.currency }}</span>
        </div>

        <UButton
          label="Create AMM Pool"
          color="primary"
          size="xl"
          block
          :loading="isCreating"
          :disabled="!isValid || isCreating"
          @click="createPool"
        />
      </div>
      <div v-else class="text-center text-red-500">
        Error: Custom token not found. Please restart training.
      </div>
    </div>

    <div v-if="isCreating || status.complete || status.error" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold mb-4">Transaction Status</h3>
      <ul class="space-y-3 font-mono text-sm">
        <li class="flex items-center gap-3">
          <Icon v-if="status.step === 1" name="eos-icons:loading" class="w-5 h-5 text-blue-500" />
          <Icon v-else-if="status.step > 1" name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          <Icon v-else name="heroicons:clock" class="w-5 h-5 text-gray-400" />
          <span :class="status.step >= 1 ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'">
            Submitting AMMCreate transaction...
          </span>
        </li>
      </ul>

      <div v-if="status.error" class="mt-4 text-red-500 text-sm">
        {{ errorMessage }}
      </div>

      <div class="mt-6 flex justify-end" v-if="status.complete">
        <UButton
          label="Continue to Swap"
          icon="i-heroicons-arrow-right"
          trailing
          size="lg"
          color="primary"
          @click="nextStep"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Client, Wallet } from 'xrpl'
import API from '~/server/client'

definePageMeta({
  middleware: 'training-client'
})

const { userWallet, customToken, unlockNextStep, participantName } = useTrainingProgress()
const router = useRouter()
const config = useRuntimeConfig()

let xrplClient: Client | null = null

const xrpAmount = ref('')
const tokenAmount = ref('')

const maxXrpBalance = ref(0)
const maxTokenBalance = ref(0)
const isLoadingBalances = ref(true)

const priceRatio = computed(() => {
  const x = Number(xrpAmount.value)
  const t = Number(tokenAmount.value)
  if (x > 0 && t > 0) return (t / x).toFixed(4)
  return '0.0000'
})

const isValid = computed(() => {
  const x = Number(xrpAmount.value)
  const t = Number(tokenAmount.value)
  return x > 0 && x <= maxXrpBalance.value - 2 && t > 0 && t <= maxTokenBalance.value // Keep 2 XRP for reserves/fees
})

const isCreating = ref(false)
const status = ref({
  step: 0,
  complete: false,
  error: false
})
const errorMessage = ref('')

const getClient = async () => {
  if (!xrplClient) {
    xrplClient = new Client(config.public.wssExplorer as string || 'wss://s.altnet.rippletest.net:51233')
  }
  if (!xrplClient.isConnected()) {
    await xrplClient.connect()
  }
  return xrplClient
}

const fetchBalances = async () => {
  if (!userWallet.value || !customToken.value) return
  isLoadingBalances.value = true
  
  try {
    const client = await getClient()
    const userAddress = userWallet.value.address
    const token = customToken.value

    const accountInfo = await client.request({ command: 'account_info', account: userAddress })
    maxXrpBalance.value = Number(accountInfo.result.account_data.Balance) / 1000000

    const lines = await client.request({ command: 'account_lines', account: userAddress })
    const tokenLine = lines.result.lines.find((l: any) => l.currency === token.currency && l.account === token.issuer)
    maxTokenBalance.value = tokenLine ? Number(tokenLine.balance) : 0
  } catch (err) {
    console.error("Fetch Balances Error", err)
  } finally {
    isLoadingBalances.value = false
  }
}

onMounted(() => {
  fetchBalances()
})

onUnmounted(() => {
  if (xrplClient && xrplClient.isConnected()) {
    xrplClient.disconnect()
  }
})

const createPool = async () => {
  if (!userWallet.value || !customToken.value) {
    errorMessage.value = "Wallet or Token not found. Please restart training."
    status.value.error = true
    return
  }

  isCreating.value = true
  status.value.step = 1
  status.value.error = false
  status.value.complete = false
  errorMessage.value = ''

  try {
    const client = await getClient()
    const user = Wallet.fromSeed(userWallet.value.seed)

    let txResponse;
    try {
      // Try to create the AMM
      txResponse = await client.submitAndWait({
        TransactionType: 'AMMCreate',
        Account: user.address,
        Amount: Math.floor(Number(xrpAmount.value) * 1000000).toString(),
        Amount2: {
          currency: customToken.value.currency,
          issuer: customToken.value.issuer,
          value: String(tokenAmount.value)
        },
        TradingFee: 500 // 0.5% default fee
      }, { autofill: true, wallet: user })
    } catch (err: any) {
      if (err.message && err.message.includes('tecAMM_EXISTS')) {
        // Fallback to AMMDeposit if it already exists
        txResponse = await client.submitAndWait({
          TransactionType: 'AMMDeposit',
          Account: user.address,
          Asset: { currency: 'XRP' },
          Asset2: { currency: customToken.value.currency, issuer: customToken.value.issuer },
          Amount: Math.floor(Number(xrpAmount.value) * 1000000).toString(),
          Amount2: {
            currency: customToken.value.currency,
            issuer: customToken.value.issuer,
            value: String(tokenAmount.value)
          },
          Flags: 1048576 // tfTwoAsset (allows depositing both assets proportionally)
        }, { autofill: true, wallet: user })
      } else {
        throw err
      }
    }

    if (txResponse.result.meta && typeof txResponse.result.meta !== 'string' && txResponse.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Transaction failed: ${txResponse.result.meta.TransactionResult}`)
    }

    status.value.step = 2
    status.value.complete = true
    await fetchBalances() // Refresh balances for next deposit

    // Fetch the AMM pool account and save to server for the participant pool list
    try {
      const ammInfoRes = await client.request({
        command: 'amm_info',
        asset: { currency: customToken.value.currency, issuer: customToken.value.issuer },
        asset2: { currency: 'XRP' }
      })
      const ammAccount = ammInfoRes.result.amm.account
      try {
        await API.updateUser({
          address: user.address,
          tokenCurrency: customToken.value.currency,
          tokenIssuer: customToken.value.issuer,
          ammAccount
        })
      } catch (updateErr: any) {
        // User may not exist in memory (server restart) — re-create then update
        await API.createUser({ xrplAddress: user.address, name: participantName.value || 'Participant' }).catch(() => {})
        await API.updateUser({
          address: user.address,
          tokenCurrency: customToken.value.currency,
          tokenIssuer: customToken.value.issuer,
          ammAccount
        })
      }
    } catch (e) {
      console.warn('Could not save ammAccount to server:', e)
    }

  } catch (err: any) {
    status.value.error = true
    errorMessage.value = err.message || 'AMM Create failed. Ensure you have enough balances.'
  } finally {
    isCreating.value = false
  }
}

const nextStep = () => {
  unlockNextStep()
  router.push('/training/swap')
}
</script>
