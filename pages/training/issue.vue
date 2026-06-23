<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-12">
    <div class="mb-8 text-center">
      <div class="text-blue-500 font-medium tracking-wider text-sm mb-2">STEP 2 OF 4</div>
      <h1 class="text-3xl font-title text-black dark:text-white mb-2">Issue a Token</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Create your own token on the XRPL Testnet. The Treasury will mint it and send it to your User wallet.
      </p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Token Symbol (3-4 characters)</label>
          <UInput v-model="tokenSymbol" placeholder="e.g. USD, DEMO" maxlength="4" size="lg" />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Supply to Mint</label>
          <UInput v-model="totalSupply" type="number" placeholder="10000" size="lg" />
        </div>

        <UButton
          label="Issue Token"
          color="primary"
          size="xl"
          block
          :loading="isIssuing"
          :disabled="!isValid || isIssuing || status.complete"
          @click="issueToken"
        />
      </div>
    </div>

    <div v-if="isIssuing || status.complete || status.error" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold mb-4">Transaction Status</h3>
      <ul class="space-y-3 font-mono text-sm">
        <li class="flex items-center gap-3">
          <Icon v-if="status.step === 1" name="eos-icons:loading" class="w-5 h-5 text-blue-500" />
          <Icon v-else-if="status.step > 1" name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          <Icon v-else name="heroicons:clock" class="w-5 h-5 text-gray-400" />
          <span :class="status.step >= 1 ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'">
            Setting DefaultRipple on Treasury...
          </span>
        </li>
        <li class="flex items-center gap-3">
          <Icon v-if="status.step === 2" name="eos-icons:loading" class="w-5 h-5 text-blue-500" />
          <Icon v-else-if="status.step > 2" name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          <Icon v-else name="heroicons:clock" class="w-5 h-5 text-gray-400" />
          <span :class="status.step >= 2 ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'">
            Creating Trustline from User to Treasury...
          </span>
        </li>
        <li class="flex items-center gap-3">
          <Icon v-if="status.step === 3" name="eos-icons:loading" class="w-5 h-5 text-blue-500" />
          <Icon v-else-if="status.step > 3" name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          <Icon v-else name="heroicons:clock" class="w-5 h-5 text-gray-400" />
          <span :class="status.step >= 3 ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'">
            Minting tokens to User wallet...
          </span>
        </li>
      </ul>

      <div v-if="status.error" class="mt-4 text-red-500 text-sm">
        {{ errorMessage }}
      </div>

      <div class="mt-6 flex justify-end" v-if="status.complete">
        <UButton
          label="Continue to AMM Pool"
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
import { ref, computed } from 'vue'
import { Client, Wallet, AccountSetAsfFlags, convertStringToHex } from 'xrpl'

definePageMeta({
  middleware: 'training-client'
})

const { issuerWallet, userWallet, setCustomToken, unlockNextStep } = useTrainingProgress()
const router = useRouter()
const config = useRuntimeConfig()

const tokenSymbol = ref('USD')
const totalSupply = ref('1000000')

const isValid = computed(() => {
  return tokenSymbol.value.length >= 3 && tokenSymbol.value.length <= 4 && Number(totalSupply.value) > 0
})

const isIssuing = ref(false)
const status = ref({
  step: 0,
  complete: false,
  error: false
})
const errorMessage = ref('')

const issueToken = async () => {
  if (!issuerWallet.value || !userWallet.value) {
    errorMessage.value = "Wallets not found. Please restart training."
    status.value.error = true
    return
  }

  isIssuing.value = true
  status.value.step = 1
  status.value.error = false
  errorMessage.value = ''

  const client = new Client(config.public.wssExplorer || 'wss://s.altnet.rippletest.net:51233')
  
  try {
    await client.connect()
    
    const issuer = Wallet.fromSeed(issuerWallet.value.seed)
    const user = Wallet.fromSeed(userWallet.value.seed)
    const currency = tokenSymbol.value.toUpperCase()
    const formattedCurrency = currency.length > 3 ? convertStringToHex(currency).padEnd(40, '0') : currency

    // Step 1: DefaultRipple on Issuer
    await client.submitAndWait({
      TransactionType: 'AccountSet',
      Account: issuer.address,
      SetFlag: AccountSetAsfFlags.asfDefaultRipple
    }, { autofill: true, wallet: issuer })
    
    status.value.step = 2

    // Step 2: TrustSet on User
    await client.submitAndWait({
      TransactionType: 'TrustSet',
      Account: user.address,
      LimitAmount: {
        currency: formattedCurrency,
        issuer: issuer.address,
        value: String(totalSupply.value)
      }
    }, { autofill: true, wallet: user })

    status.value.step = 3

    // Step 3: Payment (Mint)
    await client.submitAndWait({
      TransactionType: 'Payment',
      Account: issuer.address,
      Destination: user.address,
      Amount: {
        currency: formattedCurrency,
        issuer: issuer.address,
        value: String(totalSupply.value)
      }
    }, { autofill: true, wallet: issuer })

    status.value.step = 4
    status.value.complete = true
    
    // Save to progress
    setCustomToken({ currency: formattedCurrency, issuer: issuer.address })

  } catch (err: any) {
    status.value.error = true
    errorMessage.value = err.message || 'Transaction failed.'
  } finally {
    isIssuing.value = false
    await client.disconnect()
  }
}

const nextStep = () => {
  unlockNextStep()
  router.push('/training/pool')
}
</script>
