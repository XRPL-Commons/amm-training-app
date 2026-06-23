<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-12">
    <div class="mb-8 text-center">
      <div class="text-blue-500 font-medium tracking-wider text-sm mb-2">STEP 1 OF 4</div>
      <h1 class="text-3xl font-title text-black dark:text-white mb-2">Setup</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Enter your name and we'll generate two funded testnet wallets for you automatically.
      </p>
    </div>

    <!-- Phase A: Name input (shown before generation starts) -->
    <div v-if="phase === 'name'" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What should we call you?
          </label>
          <UInput
            v-model="nameInput"
            placeholder="e.g. Alice"
            size="xl"
            autofocus
            @keyup.enter="startTraining"
          />
          <p class="text-xs text-gray-500 mt-2">
            This name will appear in the AMM pool list visible to other participants.
          </p>
        </div>

        <UButton
          label="Start Training"
          color="primary"
          size="xl"
          block
          icon="i-heroicons-arrow-right"
          trailing
          :disabled="nameInput.trim().length < 2"
          @click="startTraining"
        />
      </div>
    </div>

    <!-- Phase B: Wallet generation (existing flow) -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
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

        <li class="flex items-center gap-3" v-if="!status.generating && !status.funding && !status.error && !status.registering">
          <Icon v-if="status.registering" name="eos-icons:loading" class="w-5 h-5 text-blue-500" />
          <Icon v-else name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          <span class="text-gray-500">Registering participant...</span>
        </li>

        <li class="flex items-center gap-3" v-if="status.registering">
          <Icon name="eos-icons:loading" class="w-5 h-5 text-blue-500" />
          <span class="text-gray-800 dark:text-gray-200">Registering participant...</span>
        </li>

        <li class="flex items-center gap-3" v-if="status.complete">
          <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-500" />
          <span class="text-gray-800 dark:text-gray-200 font-bold">
            Wallets Ready! Welcome, {{ nameInput }} 🎉
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
import API from '~/server/client'

definePageMeta({
  middleware: 'training-client'
})

const { setIssuerWallet, setUserWallet, unlockNextStep, setParticipantName, participantName } = useTrainingProgress()
const { setCurrentUser } = useWallet()
const router = useRouter()
const config = useRuntimeConfig()

// If already named (returning user), skip name phase
const phase = ref<'name' | 'generate'>(participantName.value ? 'generate' : 'name')
const nameInput = ref(participantName.value || '')

const status = ref({
  generating: false,
  funding: false,
  registering: false,
  complete: false,
  error: false
})
const errorMessage = ref('')
const issuerAddress = ref('')
const userAddress = ref('')

const startTraining = async () => {
  if (nameInput.value.trim().length < 2) return
  setParticipantName(nameInput.value.trim())
  phase.value = 'generate'
  await generateWallets()
}

const generateWallets = async () => {
  try {
    status.value = { generating: true, funding: false, registering: false, complete: false, error: false }
    
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
    const client = new Client(config.public.wssExplorer as string || 'wss://s.altnet.rippletest.net:51233')
    await client.connect()

    try {
      await client.fundWallet(issuer)
      await client.fundWallet(user)
      status.value.funding = false
      status.value.registering = true
    } catch (err: any) {
      throw new Error('Faucet failed. Please retry.')
    } finally {
      await client.disconnect()
    }

    // 3. Register participant on server (best-effort, don't fail training if this fails)
    try {
      await API.createUser({ xrplAddress: user.address, name: nameInput.value.trim() })
    } catch (e) {
      // User may already exist (e.g. page refresh) — ignore duplicate errors
      console.warn('User registration skipped (may already exist):', e)
    }

    status.value.registering = false
    status.value.complete = true

    // Update profile name in navbar
    setCurrentUser({ name: nameInput.value.trim(), xrplAddress: user.address })
    
  } catch (err: any) {
    status.value.generating = false
    status.value.funding = false
    status.value.registering = false
    status.value.error = true
    errorMessage.value = err.message || 'An unknown error occurred.'
  }
}

const nextStep = () => {
  unlockNextStep()
  router.push('/training/issue')
}

onMounted(() => {
  // If returning to this page with wallets already generated, auto-proceed
  if (phase.value === 'generate' && participantName.value) {
    generateWallets()
  }
})
</script>
