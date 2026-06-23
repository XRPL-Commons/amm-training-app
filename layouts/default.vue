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
          <!-- Clickable profile area if connected -->
          <button
            v-else
            class="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            @click="showProfileModal = true"
          >
            <span v-if="currentUser" class="text-sm text-gray-600 dark:text-gray-400">{{ currentUser.name }}</span>
            <ColoredAddress :address="xrplAddress" variant="bars" />
          </button>
        </div>
        <ColorMode />
      </div>
    </div>
  </div>
  <ShapesBackground />

  <div class="pt-20 pr-4 pl-4 sm:pr-4 sm:pl-4 relative overflow-auto">
    <slot />
  </div>

  <!-- Profile Modal -->
  <UModal v-model="showProfileModal">
    <div class="p-6">
      <h3 class="text-lg font-title text-gray-900 dark:text-white mb-4">Your Profile</h3>

      <div v-if="issuerWallet" class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
        <div class="flex justify-between items-center mb-2">
          <div class="text-xs text-gray-500 uppercase font-semibold">Treasury / Issuer Address</div>
          <div class="text-xs font-bold text-blue-500">{{ treasuryXrpBalance }} XRP</div>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="font-mono text-sm text-gray-800 dark:text-gray-200 break-all">{{ issuerWallet.address }}</span>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-clipboard-document"
            size="xs"
            @click="copyAddress(issuerWallet.address)"
          />
        </div>
      </div>

      <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
        <div class="flex justify-between items-center mb-2">
          <div class="text-xs text-gray-500 uppercase font-semibold">User / Receiver Address</div>
          <div class="text-xs font-bold text-blue-500">{{ walletXrpBalance }} XRP</div>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="font-mono text-sm text-gray-800 dark:text-gray-200 break-all">{{ xrplAddress }}</span>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-clipboard-document"
            size="xs"
            @click="copyAddress(xrplAddress)"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-8">
        <UButton color="primary" variant="ghost" @click="showProfileModal = false">
          Close
        </UButton>
        <UButton color="red" variant="soft" @click="handleDisconnect" icon="i-heroicons-arrow-right-on-rectangle">
          Disconnect
        </UButton>
      </div>
    </div>
  </UModal>
</template>

<script lang="ts" setup>
const { isConnected, xrplAddress, currentUser, walletXrpBalance, treasuryXrpBalance, loadFromStorage, connectWallet, disconnectWallet } = useWallet()
const { issuerWallet } = useTrainingProgress()
const toast = useToast()

const showProfileModal = ref(false)

onMounted(() => {
  loadFromStorage()
})

async function connect() {
  await connectWallet()
}

function handleDisconnect() {
  disconnectWallet()
  showProfileModal.value = false
}

function copyAddress(address: string) {
  navigator.clipboard.writeText(address)
  toast.add({ title: 'Address copied', icon: 'i-heroicons-clipboard-document-check' })
}
</script>
