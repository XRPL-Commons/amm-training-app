<template>
  <div class="w-full max-w-4xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <img src="/xrpl.png" class="h-8 opacity-80 hidden dark:block" />
        <img src="/xrplb.png" class="h-8 opacity-80 dark:hidden" />
        <h1 class="text-2xl font-title text-black dark:text-white">Admin</h1>
      </div>
      <NuxtLink to="/" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
    </div>

    <!-- Actions Bar -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg font-title text-gray-800 dark:text-white">Users</span>
          <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-sm">
            {{ users.length }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <UTooltip text="Refresh">
            <UButton @click="refreshUsers" color="gray" variant="ghost" size="sm" icon="i-heroicons-arrow-path" />
          </UTooltip>
          <UTooltip text="Download backup">
            <UButton @click="downloadBackup" color="primary" variant="ghost" size="sm" icon="i-heroicons-arrow-down-tray" />
          </UTooltip>
          <UTooltip text="Restore from file">
            <UButton @click="triggerFileInput" color="orange" variant="ghost" size="sm" icon="i-heroicons-arrow-up-tray" />
          </UTooltip>
          <UTooltip text="Clear all users">
            <UButton
              v-if="!confirmClear"
              @click="confirmClear = true"
              color="red"
              variant="ghost"
              size="sm"
              icon="i-heroicons-trash"
            />
            <div v-else class="flex items-center gap-1">
              <UButton @click="clearAllUsers" color="red" size="xs">Confirm</UButton>
              <UButton @click="confirmClear = false" color="gray" size="xs">Cancel</UButton>
            </div>
          </UTooltip>
        </div>
      </div>
      <input
        type="file"
        ref="fileInput"
        accept=".json"
        @change="handleFileSelect"
        class="hidden"
      />
      <div v-if="restoreStatus" class="mt-2 text-sm text-green-600 dark:text-green-400">
        {{ restoreStatus }}
      </div>
    </div>

    <!-- Users Table -->
    <div v-if="users.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <table class="w-full text-sm text-left">
        <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          <tr>
            <th class="py-3 px-4">Name</th>
            <th class="py-3 px-4">Address</th>
            <th class="py-3 px-4 text-right">Joined</th>
          </tr>
        </thead>
        <tbody class="text-gray-700 dark:text-gray-300">
          <tr
            v-for="user in users"
            :key="user.xrplAddress"
            class="border-t border-gray-100 dark:border-gray-700"
          >
            <td class="py-3 px-4 font-medium">{{ user.name }}</td>
            <td class="py-3 px-4 font-mono text-xs text-gray-500">{{ user.xrplAddress }}</td>
            <td class="py-3 px-4 text-right text-gray-500">{{ formatDate(user.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-500">
      No users registered
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
    alert('Failed to create backup')
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
    setTimeout(() => { restoreStatus.value = '' }, 3000)
  } catch (error) {
    alert('Failed to restore backup')
  }
  input.value = ''
}

async function clearAllUsers() {
  try {
    await API.clearUsers({})
    confirmClear.value = false
    await refreshUsers()
  } catch (error) {
    alert('Failed to clear users')
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}
</script>
