<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-12">
    <div class="mb-8 text-center">
      <div class="text-blue-500 font-medium tracking-wider text-sm mb-2">STEP 1 OF 4</div>
      <h1 class="text-3xl font-title text-black dark:text-white mb-2">Generating Wallets</h1>
      <p class="text-gray-600 dark:text-gray-400">
        We are generating two testnet wallets for you behind the scenes. No setup required!
      </p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
      <ul class="space-y-4 font-mono text-sm">
        <li class="flex items-center gap-3">
          <Icon v-if="status.generating" name="eos-icons:loading" class="w-5 h-5 text-blue-500" />
          <Icon v-else name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          <span :class="status.generating ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'">
            Generating Treasury (Issuer) Wallet...
          </span>
        </li>
        
        <li class="flex items-center gap-3">
          <Icon v-if="status.generating" name="eos-icons:loading" class="w-5 h-5 text-blue-500" />
          <Icon v-else name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          <span :class="status.generating ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'">
            Generating User (Receiver) Wallet...
          </span>
        </li>

        <li class="flex items-center gap-3" v-if="!status.generating">
          <Icon v-if="status.funding" name="eos-icons:loading" class="w-5 h-5 text-blue-500" />
          <Icon v-else name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          <span :class="status.funding ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'">
            Funding wallets from XRPL Testnet Faucet (this takes ~10 seconds)...
          </span>
        </li>

        <li class="flex items-center gap-3" v-if="status.complete">
          <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          <span class="text-gray-800 dark:text-gray-200 font-bold">
            Wallets Ready!
          </span>
        </li>

        <li class="flex items-center gap-3" v-if="status.error">
          <Icon name="heroicons:x-circle" class="w-5 h-5 text-red-500" />
          <span class="text-red-500">
            {{ errorMessage }}
          </span>
        </li>
      </ul>

      <!-- Display generated info securely -->
      <div v-if="status.complete" class="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 class="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">Your Testnet Addresses</h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Issuer:</span>
            <span class="font-mono">{{ issuerAddress }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">User:</span>
            <span class="font-mono">{{ userAddress }}</span>
          </div>
        </div>
      </div>

      <div class="mt-8 flex justify-end">
        <UButton
          v-if="status.complete"
          label="Continue to Token Issuance"
          icon="i-heroicons-arrow-right"
          trailing
          size="lg"
          color="primary"
          @click="nextStep"
        />
        <UButton
          v-if="status.error"
          label="Retry"
          icon="i-heroicons-arrow-path"
          size="lg"
          color="gray"
          :disabled="status.generating || status.funding || status.complete"
          @click="generateWallets"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Client, Wallet } from 'xrpl'

definePageMeta({
  middleware: 'training-client'
})

const { setIssuerWallet, setUserWallet, unlockNextStep } = useTrainingProgress()
const router = useRouter()
const config = useRuntimeConfig()

const status = ref({
  generating: true,
  funding: false,
  complete: false,
  error: false
})
const errorMessage = ref('')
const issuerAddress = ref('')
const userAddress = ref('')

const generateWallets = async () => {
  try {
    status.value = { generating: true, funding: false, complete: false, error: false }
    
    // 1. Generate Wallets
    const issuer = Wallet.generate()
    const user = Wallet.generate()
    
    issuerAddress.value = issuer.address
    userAddress.value = user.address
    
    setIssuerWallet({ address: issuer.address, seed: issuer.seed! })
    setUserWallet({ address: user.address, seed: user.seed! })
    
    status.value.generating = false
    status.value.funding = true

    // 2. Fund Wallets using Faucet
    const client = new Client(config.public.wssExplorer || 'wss://s.altnet.rippletest.net:51233')
    await client.connect()

    try {
      await client.fundWallet(issuer)
      await client.fundWallet(user)
      status.value.funding = false
      status.value.complete = true
    } catch (err: any) {
      throw new Error('Faucet failed. Please retry.')
    } finally {
      await client.disconnect()
    }
    
  } catch (err: any) {
    status.value.generating = false
    status.value.funding = false
    status.value.error = true
    errorMessage.value = err.message || 'An unknown error occurred.'
  }
}

const nextStep = () => {
  unlockNextStep()
  router.push('/training/issue')
}

onMounted(() => {
  generateWallets()
})
</script>
