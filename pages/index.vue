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
        Learn how Automated Market Makers work on the XRP Ledger. Complete the end-to-end journey without any setup.
      </p>

      <!-- Roadmap -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
        <div class="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs">1</div>
            <span class="font-medium text-gray-800 dark:text-white">Setup</span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Auto-generate testnet wallets
          </p>
        </div>
        <div class="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-2 mb-2">
             <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs">2</div>
            <span class="font-medium text-gray-800 dark:text-white">Issue</span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Issue your own token on the testnet
          </p>
        </div>
        <div class="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs">3</div>
            <span class="font-medium text-gray-800 dark:text-white">Pool</span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Create a native AMM pool
          </p>
        </div>
        <div class="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs">4</div>
            <span class="font-medium text-gray-800 dark:text-white">Swap</span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Trade tokens against your AMM pool
          </p>
        </div>
      </div>

      <!-- CTA -->
      <UButton
        label="Start Training"
        @click="startTraining"
        size="xl"
        class="font-title"
        icon="i-heroicons-arrow-right"
        trailing
      />

      <p class="text-sm text-gray-500 mt-4">
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

const startTraining = () => {
  router.push('/training/setup')
}
</script>
