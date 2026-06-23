<template>
  <div class="max-w-md mx-auto">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
      <div class="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
        <Icon name="heroicons:link" class="w-7 h-7 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Setting Up Trustline</h2>
      <p class="text-sm text-gray-500 mb-6">
        To receive <strong>{{ pool?.tokenCurrency }}</strong> from this pool, your wallet needs a trustline
        to the issuer. This is a one-time, automatic setup.
      </p>
      <ul class="space-y-3 text-left font-mono text-sm mb-6">
        <li class="flex items-center gap-3">
          <Icon v-if="status === 'submitting'" name="eos-icons:loading" class="w-5 h-5 text-blue-500 shrink-0" />
          <Icon v-else-if="status === 'done' || status === 'proceeding'" name="heroicons:check-circle" class="w-5 h-5 text-green-500 shrink-0" />
          <Icon v-else name="heroicons:clock" class="w-5 h-5 text-gray-400 shrink-0" />
          <span :class="status === 'submitting' ? 'text-gray-800 dark:text-gray-200' : status === 'done' ? 'text-gray-500' : 'text-gray-400'">
            Submitting TrustSet transaction...
          </span>
        </li>
        <li v-if="status === 'done' || status === 'proceeding'" class="flex items-center gap-3">
          <Icon v-if="status === 'proceeding'" name="eos-icons:loading" class="w-5 h-5 text-blue-500 shrink-0" />
          <Icon v-else name="heroicons:check-circle" class="w-5 h-5 text-green-500 shrink-0" />
          <span class="text-gray-800 dark:text-gray-200">Proceeding to swap...</span>
        </li>
      </ul>
      <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  pool: any
  status: 'idle' | 'submitting' | 'done' | 'proceeding'
  error: string
}>()
</script>
