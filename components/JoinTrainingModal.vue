<template>
  <UModal :model-value="true">
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
          <UInput v-model="name" placeholder="Enter your name" autofocus />
        </UFormGroup>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2 mt-6">
        <UButton color="primary" variant="ghost" @click="closeModal" :disabled="joining">Cancel</UButton>
        <UButton color="primary" @click="joinTraining" :loading="joining">Join</UButton>
      </div>
    </div>
  </UModal>
</template>

<script lang="ts" setup>
import API from '~/server/client'

const props = defineProps(['xrplAddress'])
const { xrplAddress } = toRefs(props)

const modal = useModal()
const { addUserOptimistic, fetchUsers } = useUsers()

const name = ref('')
const joining = ref(false)

const closeModal = () => {
  modal.close()
}

const joinTraining = async () => {
  if (!isNameValid()) {
    alert("Name cannot be empty")
    return
  }

  joining.value = true
  const trimmedName = name.value.trim()
  const address = xrplAddress?.value

  // Optimistic update
  addUserOptimistic({ xrplAddress: address, name: trimmedName })
  modal.close()

  try {
    await API.createUser({ xrplAddress: address, name: trimmedName })
    // Refresh to get server state
    await fetchUsers()
  } catch (error) {
    // Refresh to revert optimistic update
    await fetchUsers()
    alert("Error creating user: " + error)
  } finally {
    joining.value = false
  }
}

function isNameValid() {
  return name.value !== null && name.value.trim() !== ''
}
</script>