<template>
  <UModal v-model="isOpen" class="">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }" class="text-center">
      <div class="font-title mb-4">Connect to your wallet</div>
      <div class="flex justify-center">
        <img :src="qrCodeSrc" alt="QR Code (click to copy)" class="rounded-md" @click="onImageClick()">
      </div>
      <div class="font-title mt-4">
        <p>Scan with Xaman or click the image to copy code manually.</p>
      </div>
    </UCard>
  </UModal>
</template>

<script lang="ts" setup>
const props = defineProps(['isOpen', 'qrCodeSrc', 'isConnection', 'mobileUrl', 'uuid'])
const {
  isOpen,
  qrCodeSrc,
  mobileUrl,
  uuid
} = toRefs(props)

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