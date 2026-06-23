<template>
  <div
    class="text-xl px-4 py-1  w-full fixed top-0 left-0 z-20 border-transparent lg:block backdrop-blur-md bg-transparent dark:bg-transparent  text-gray-900 m-0 block">
    <div class="flex justify-between items-center content-center">
      <div class="flex justify-start items-center">
        <NuxtLink to="/"
          class=" text-stratos-950 text-xl sm:text-3xl rounded-full px-0 py-1 font-title inline-flex items-center">
          <div class="hover:scale-110 p-2 transition-all cursor-pointer flex justify-start items-center flex-auto ">
            <img src="/xrpl.png" class="h-8 opacity-80 hidden dark:block" />
            <img src="/xrplb.png" class="h-8 opacity-80 dark:invisible dark:hidden" />

          </div>
          <div class="ml-2 md:text-4xl text-xl font-title text-black dark:text-white">AMM Training</div>
        </NuxtLink>
      </div>

      <div class="pl-1 flex items-center gap-3">
        <!-- Wallet controls -->
        <div class="flex items-center gap-2">
          <!-- Connect button when not connected -->
          <UButton v-if="!isConnected" color="primary" size="sm" @click="connect" icon="i-heroicons-wallet">
            Connect
          </UButton>
          <!-- Clickable profile area if connected — navigates to /profile page -->
          <NuxtLink
            v-else
            to="/profile"
            class="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span v-if="currentUser" class="text-sm text-gray-600 dark:text-gray-400">{{ currentUser.name }}</span>
            <ColoredAddress :address="xrplAddress" variant="bars" />
          </NuxtLink>
        </div>
        <ColorMode />
      </div>
    </div>
  </div>
  <ShapesBackground />

  <div class="pt-20 pr-4 pl-4 sm:pr-4 sm:pl-4 relative overflow-auto">
    <slot />
  </div>
</template>

<script lang="ts" setup>
const { isConnected, xrplAddress, currentUser, loadFromStorage, connectWallet } = useWallet()
const { loadProgress } = useTrainingProgress()

onMounted(async () => {
  // Load wallets from localStorage first, then fetch balances
  loadProgress()
  await loadFromStorage()
})

async function connect() {
  await connectWallet()
}
</script>
