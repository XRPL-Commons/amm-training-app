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
            <UButton @click="showClearModal = true" color="red" variant="ghost" size="sm" icon="i-heroicons-trash" />
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
            <th class="py-3 px-4">Joined</th>
            <th class="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-gray-700 dark:text-gray-300">
          <tr
            v-for="user in users"
            :key="user.xrplAddress"
            class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <td class="py-3 px-4 font-medium cursor-pointer" @click="openUserDetails(user)">
              {{ user.name }}
            </td>
            <td class="py-3 px-4 cursor-pointer" @click="openUserDetails(user)">
              <ColoredAddress :address="user.xrplAddress" variant="text" class="text-xs" />
            </td>
            <td class="py-3 px-4 text-gray-500 text-xs">
              <div>{{ formatDate(user.createdAt) }}</div>
              <div class="text-gray-400">{{ formatTime(user.createdAt) }}</div>
            </td>
            <td class="py-3 px-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <UTooltip text="Edit name">
                  <UButton
                    @click.stop="openEditModal(user)"
                    color="gray"
                    variant="ghost"
                    size="xs"
                    icon="i-heroicons-pencil"
                  />
                </UTooltip>
                <UTooltip text="Delete user">
                  <UButton
                    @click.stop="openDeleteModal(user)"
                    color="red"
                    variant="ghost"
                    size="xs"
                    icon="i-heroicons-trash"
                  />
                </UTooltip>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-500">
      No users registered
    </div>

    <!-- User Details Slideover -->
    <AdminUserSlideover
      v-model="showUserSlideover"
      :user="selectedUser"
      @viewAmm="openAmmDetails"
    />

    <!-- AMM Details Slideover -->
    <AdminAmmSlideover
      v-model="showAmmSlideover"
      :token="selectedToken"
    />

    <!-- Edit User Modal -->
    <UModal v-model="showEditModal">
      <div class="p-6">
        <h3 class="text-lg font-title text-gray-900 dark:text-white mb-4">Edit User</h3>
        <div class="mb-4">
          <div class="text-xs text-gray-500 mb-1">Address</div>
          <div v-if="editingUser">
            <ColoredAddress :address="editingUser.xrplAddress" variant="boxes" />
          </div>
        </div>
        <UFormGroup label="Name">
          <UInput v-model="editName" placeholder="Enter name" />
        </UFormGroup>
        <div class="flex justify-end gap-2 mt-6">
          <UButton color="gray" variant="soft" @click="showEditModal = false">Cancel</UButton>
          <UButton color="primary" @click="saveUserName" :loading="saving">Save</UButton>
        </div>
      </div>
    </UModal>

    <!-- Delete User Modal -->
    <UModal v-model="showDeleteModal">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-title text-gray-900 dark:text-white">Delete user?</h3>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-2">
          Are you sure you want to delete <strong>{{ deletingUser?.name }}</strong>?
        </p>
        <div v-if="deletingUser" class="mb-6">
          <ColoredAddress :address="deletingUser.xrplAddress" variant="boxes" />
        </div>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="soft" @click="showDeleteModal = false">Cancel</UButton>
          <UButton color="red" @click="deleteUser" :loading="deleting">Delete</UButton>
        </div>
      </div>
    </UModal>

    <!-- Clear All Modal -->
    <UModal v-model="showClearModal">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-title text-gray-900 dark:text-white">Clear all users?</h3>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          This will remove all {{ users.length }} users. This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="soft" @click="showClearModal = false">Cancel</UButton>
          <UButton color="red" @click="clearAllUsers">Clear All</UButton>
        </div>
      </div>
    </UModal>
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

interface Token {
  currency: string
  issuer: string
  amount: string
}

const users = ref<User[]>([])
const restoreStatus = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// Slideover state
const showUserSlideover = ref(false)
const showAmmSlideover = ref(false)
const selectedUser = ref<User | null>(null)
const selectedToken = ref<Token | null>(null)

// Modal state
const showClearModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingUser = ref<User | null>(null)
const deletingUser = ref<User | null>(null)
const editName = ref('')
const saving = ref(false)
const deleting = ref(false)

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

function openUserDetails(user: User) {
  selectedUser.value = user
  showUserSlideover.value = true
}

function openAmmDetails(token: Token) {
  selectedToken.value = token
  showAmmSlideover.value = true
}

function openEditModal(user: User) {
  editingUser.value = user
  editName.value = user.name
  showEditModal.value = true
}

function openDeleteModal(user: User) {
  deletingUser.value = user
  showDeleteModal.value = true
}

async function saveUserName() {
  if (!editingUser.value || !editName.value.trim()) return

  saving.value = true
  try {
    await API.updateUser({
      address: editingUser.value.xrplAddress,
      name: editName.value.trim()
    })
    showEditModal.value = false
    await refreshUsers()
  } catch (error) {
    alert('Failed to update user name')
  } finally {
    saving.value = false
  }
}

async function deleteUser() {
  if (!deletingUser.value) return

  deleting.value = true
  try {
    await API.deleteUser({ address: deletingUser.value.xrplAddress })
    showDeleteModal.value = false
    await refreshUsers()
  } catch (error) {
    alert('Failed to delete user')
  } finally {
    deleting.value = false
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
    showClearModal.value = false
    await refreshUsers()
  } catch (error) {
    alert('Failed to clear users')
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
