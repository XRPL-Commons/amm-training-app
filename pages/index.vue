<template>
  <div class="w-full min-h-screen flex flex-col items-center justify-center px-4">
    <!-- Hero -->
    <div class="text-center max-w-2xl">
      <div class="flex justify-center items-center gap-3 mb-6">
        <img src="/xrpl.png" class="h-12 opacity-90 hidden dark:block" />
        <img src="/xrplb.png" class="h-12 opacity-90 dark:hidden" />
        <h1 class="text-4xl md:text-5xl font-title text-black dark:text-white">
          AMM Training
        </h1>
      </div>

      <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
        Learn how Automated Market Makers work on the XRP Ledger
      </p>

      <!-- Features -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-left">
        <div class="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="heroicons:wallet" class="w-5 h-5 text-blue-500" />
            <span class="font-medium text-gray-800 dark:text-white">Connect</span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Sign in with your Xaman wallet to get started
          </p>
        </div>
        <div class="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="heroicons:currency-dollar" class="w-5 h-5 text-green-500" />
            <span class="font-medium text-gray-800 dark:text-white">Explore</span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            View tokens, set trustlines, and check balances
          </p>
        </div>
        <div class="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="heroicons:arrow-path-rounded-square" class="w-5 h-5 text-purple-500" />
            <span class="font-medium text-gray-800 dark:text-white">Swap</span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Trade tokens using AMM liquidity pools
          </p>
        </div>
      </div>

      <!-- CTA -->
      <UButton
        label="Let's Go"
        @click="submit"
        size="xl"
        class="font-title"
        icon="i-heroicons-arrow-right"
        trailing
      />

      <p class="text-sm text-white mt-4">
        Running on XRPL Testnet
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

definePageMeta({
  layout: 'home'
})

const submit = () => {
  router.push('/training')
}
</script>
