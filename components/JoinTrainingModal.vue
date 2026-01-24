<template>  
  <UModal v-model="isOpen" class="">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }" class="text-center">
      <span class="absolute top-0 right-0 p-4 cursor-pointer" @click="closeModal">&times;</span>
      <div class="font-title mb-4">Fill the details</div>
      <div class="flex flex-col items-center space-y-4">
        <UInput v-model="xrplAddress" placeholder="XRPL Address" disabled />
        <UInput v-model="name" placeholder="Name" />
        <UButton @click="joinTraining">Join</UButton>
      </div>
    </UCard>
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