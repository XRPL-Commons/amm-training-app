<template>
  <div class="w-full max-w-4xl mx-auto p-6">
    <div class="flex items-center justify-center mt-10 mb-8">
      <img src="/xrpl.png" class="h-8 opacity-80 hidden dark:block" />
      <img src="/xrplb.png" class="h-8 opacity-80 dark:hidden" />
      <h1 class="ml-3 text-3xl font-title text-black dark:text-white">Admin Panel</h1>
    </div>

    <div class="grid gap-6">
      <!-- Users Overview -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-title mb-4 text-gray-800 dark:text-white">Users Overview</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Currently <span class="font-bold">{{ users.length }}</span> users registered
        </p>
        <UButton @click="refreshUsers" color="gray" size="sm">
          Refresh
        </UButton>
      </div>

      <!-- Backup Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-title mb-4 text-gray-800 dark:text-white">Backup Users</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Download all user data as a JSON file.
        </p>
        <UButton @click="downloadBackup" color="primary" size="md">
          Download Backup
        </UButton>
      </div>

      <!-- Restore Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-title mb-4 text-gray-800 dark:text-white">Restore Users</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Upload a backup file to restore users. This will replace all current users.
        </p>
        <input
          type="file"
          ref="fileInput"
          accept=".json"
          @change="handleFileSelect"
          class="hidden"
        />
        <UButton @click="triggerFileInput" color="orange" size="md">
          Upload Backup
        </UButton>
        <span v-if="restoreStatus" class="ml-4 text-green-600 dark:text-green-400">
          {{ restoreStatus }}
        </span>
      </div>

      <!-- Clear Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-red-200 dark:border-red-800">
        <h2 class="text-xl font-title mb-4 text-red-600 dark:text-red-400">Clear All Users</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Remove all users from memory. This action cannot be undone.
        </p>
        <UButton
          v-if="!confirmClear"
          @click="confirmClear = true"
          color="red"
          variant="outline"
          size="md"
        >
          Clear All Users
        </UButton>
        <div v-else class="flex gap-2">
          <UButton @click="clearAllUsers" color="red" size="md">
            Confirm Clear
          </UButton>
          <UButton @click="confirmClear = false" color="gray" size="md">
            Cancel
          </UButton>
        </div>
      </div>

      <!-- Users Table -->
      <div v-if="users.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-title mb-4 text-gray-800 dark:text-white">Registered Users</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th class="py-3 px-4">Name</th>
                <th class="py-3 px-4">XRPL Address</th>
                <th class="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.xrplAddress"
                class="border-b dark:border-gray-700"
              >
                <td class="py-3 px-4">{{ user.name }}</td>
                <td class="py-3 px-4 font-mono text-xs">{{ user.xrplAddress }}</td>
                <td class="py-3 px-4">{{ formatDate(user.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Back link -->
    <div class="mt-8 text-center">
      <NuxtLink to="/" class="text-blue-600 dark:text-blue-400 hover:underline">
        ← Back to Home
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import API from '~/server/client'

interface User {
  xrplAddress: string
  name: string
  createdAt: string
}

const users = ref<User[]>([])
const confirmClear = ref(false)
const restoreStatus = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  await refreshUsers()
})

async function refreshUsers() {
  try {
    users.value = await API.getUsers({})
  } catch (error) {
    console.error('Failed to fetch users:', error)
  }
}

async function downloadBackup() {
  try {
    const backup = await API.backupUsers({})
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('Failed to create backup: ' + error)
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    await API.restoreUsers(data)
    restoreStatus.value = `Restored ${data.users?.length || 0} users`
    await refreshUsers()

    setTimeout(() => {
      restoreStatus.value = ''
    }, 3000)
  } catch (error) {
    alert('Failed to restore backup: ' + error)
  }

  input.value = ''
}

async function clearAllUsers() {
  try {
    await API.clearUsers({})
    confirmClear.value = false
    await refreshUsers()
  } catch (error) {
    alert('Failed to clear users: ' + error)
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}
</script>
