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
  isConnection,
  mobileUrl,
  uuid
} = toRefs(props)

const closeModal = () => {
  this.$emit('close');
}
const onImageClick = async () => {
  if (mobileUrl && mobileUrl.value) {
    window.open(mobileUrl.value, '_blank')
  } else {
    try {
      await navigator.clipboard.writeText(value)
      console.log('Text copied to clipboard')
      alert("Copied to clipboard. Paste in Xaman to continue.")
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Optionally, fallback to another copy method or show an error message.
    }
  }
}
</script>