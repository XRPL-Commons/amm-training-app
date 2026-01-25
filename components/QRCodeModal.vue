<template>
  <UModal :model-value="true">
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-title text-gray-800 dark:text-white">Connect to your wallet</h3>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeModal" />
      </div>
      <div class="flex justify-center">
        <img :src="qrCodeSrc" alt="QR Code (click to copy)" class="rounded-md cursor-pointer" @click="onImageClick()">
      </div>
      <p class="text-sm text-gray-500 text-center mt-4">Scan with Xaman or click the image to copy code manually.</p>
    </div>
  </UModal>
</template>

<script lang="ts" setup>
const props = defineProps(['qrCodeSrc', 'mobileUrl', 'uuid'])
const { qrCodeSrc, mobileUrl, uuid } = toRefs(props)

const modal = useModal()

const closeModal = () => {
  modal.close()
}

const onImageClick = async () => {
  if (mobileUrl && mobileUrl.value) {
    window.open(mobileUrl.value, '_blank')
  } else if (uuid && uuid.value) {
    try {
      await navigator.clipboard.writeText(uuid.value)
      alert("Copied to clipboard. Paste in Xaman to continue.")
    } catch (err) {
      alert("Failed to copy to clipboard")
    }
  }
}
</script>