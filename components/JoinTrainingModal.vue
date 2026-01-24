<template>
  <UModal v-model="isOpen">
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-title text-gray-800 dark:text-white">Join Training</h3>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeModal" />
      </div>

      <!-- Content -->
      <div class="space-y-4">
        <UFormGroup label="XRPL Address">
          <ColoredAddress v-if="xrplAddress" :address="xrplAddress" />
        </UFormGroup>

        <UFormGroup label="Name">
          <UInput v-model="name" placeholder="Enter your name" />
        </UFormGroup>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2 mt-6">
        <UButton color="gray" variant="soft" @click="closeModal">Cancel</UButton>
        <UButton color="primary" @click="joinTraining">Join</UButton>
      </div>
    </div>
  </UModal>
</template>

<script lang="ts" setup>
/* @ts-ignore */
import API from '~/server/client'

const props = defineProps(['xrplAddress', 'isOpen'])
const {
  xrplAddress,
  isOpen,
} = toRefs(props);

const name = ref('');

const emit = defineEmits(['close']);

const closeModal = () => {
  emit('close');
}

const joinTraining = async () => {
  try {
      if (!isNameValid()) {
        alert("Name cannot be empty")
        return
      }
      await API.createUser({ 
        xrplAddress: xrplAddress?.value, 
        name: name.value.trim()
      })
      emit('close');   
  } catch (error) {
      alert("Error creating user: " + error);
  }      
}

function isNameValid() {
  return name.value !== null && name.value.trim() !== '';
}
</script>