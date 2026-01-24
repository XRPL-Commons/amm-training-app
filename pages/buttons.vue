<template>
  <div class="w-full max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-title text-black dark:text-white">Button Variants</h1>
      <NuxtLink to="/" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
    </div>

    <!-- Colors -->
    <section class="mb-8">
      <h2 class="text-lg font-title text-gray-800 dark:text-white mb-4">Colors</h2>
      <div class="flex flex-wrap gap-2">
        <UButton color="primary">Primary</UButton>
        <UButton color="gray">Gray</UButton>
        <UButton color="red">Red</UButton>
        <UButton color="orange">Orange</UButton>
        <UButton color="green">Green</UButton>
        <UButton color="blue">Blue</UButton>
        <UButton color="purple">Purple</UButton>
      </div>
    </section>

    <!-- Variants -->
    <section class="mb-8">
      <h2 class="text-lg font-title text-gray-800 dark:text-white mb-4">Variants (Primary)</h2>
      <div class="flex flex-wrap gap-2">
        <UButton color="primary" variant="solid">Solid</UButton>
        <UButton color="primary" variant="soft">Soft</UButton>
        <UButton color="primary" variant="outline">Outline</UButton>
        <UButton color="primary" variant="ghost">Ghost</UButton>
        <UButton color="primary" variant="link">Link</UButton>
      </div>
    </section>

    <!-- Variants Gray -->
    <section class="mb-8">
      <h2 class="text-lg font-title text-gray-800 dark:text-white mb-4">Variants (Gray)</h2>
      <div class="flex flex-wrap gap-2">
        <UButton color="gray" variant="solid">Solid</UButton>
        <UButton color="gray" variant="soft">Soft</UButton>
        <UButton color="gray" variant="outline">Outline</UButton>
        <UButton color="gray" variant="ghost">Ghost</UButton>
        <UButton color="gray" variant="link">Link</UButton>
      </div>
    </section>

    <!-- Sizes -->
    <section class="mb-8">
      <h2 class="text-lg font-title text-gray-800 dark:text-white mb-4">Sizes</h2>
      <div class="flex flex-wrap items-center gap-2">
        <UButton size="2xs">2XS</UButton>
        <UButton size="xs">XS</UButton>
        <UButton size="sm">SM</UButton>
        <UButton size="md">MD</UButton>
        <UButton size="lg">LG</UButton>
        <UButton size="xl">XL</UButton>
      </div>
    </section>

    <!-- With Icons -->
    <section class="mb-8">
      <h2 class="text-lg font-title text-gray-800 dark:text-white mb-4">With Icons</h2>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-heroicons-arrow-path">Refresh</UButton>
        <UButton icon="i-heroicons-plus">Add</UButton>
        <UButton icon="i-heroicons-trash" color="red">Delete</UButton>
        <UButton icon="i-heroicons-pencil" color="gray" variant="soft">Edit</UButton>
        <UButton trailing-icon="i-heroicons-arrow-right">Next</UButton>
      </div>
    </section>

    <!-- Icon Only -->
    <section class="mb-8">
      <h2 class="text-lg font-title text-gray-800 dark:text-white mb-4">Icon Only</h2>
      <div class="flex flex-wrap items-center gap-2">
        <UButton icon="i-heroicons-arrow-path" color="gray" variant="ghost" />
        <UButton icon="i-heroicons-plus" color="primary" />
        <UButton icon="i-heroicons-trash" color="red" variant="soft" />
        <UButton icon="i-heroicons-pencil" color="gray" variant="outline" />
        <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" />
      </div>
    </section>

    <!-- States -->
    <section class="mb-8">
      <h2 class="text-lg font-title text-gray-800 dark:text-white mb-4">States</h2>
      <div class="flex flex-wrap gap-2">
        <UButton>Normal</UButton>
        <UButton loading>Loading</UButton>
        <UButton disabled>Disabled</UButton>
        <UButton block class="mt-2">Block (Full Width)</UButton>
      </div>
    </section>

    <!-- App-Specific Combinations -->
    <section class="mb-8">
      <h2 class="text-lg font-title text-gray-800 dark:text-white mb-4">App Combinations</h2>
      <div class="space-y-4">
        <div>
          <div class="text-xs text-gray-500 mb-2">Token Actions</div>
          <div class="flex flex-wrap gap-2">
            <UButton size="xs" color="primary" variant="soft" icon="i-heroicons-arrow-path-rounded-square">AMM</UButton>
            <UButton size="xs" color="primary" variant="ghost" icon="i-heroicons-pencil-square">Trustline</UButton>
            <UButton size="xs" color="primary" variant="ghost" icon="i-heroicons-plus">Trustline</UButton>
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500 mb-2">Admin Actions</div>
          <div class="flex flex-wrap gap-2">
            <UButton color="gray" variant="ghost" size="sm" icon="i-heroicons-arrow-path" />
            <UButton color="primary" variant="ghost" size="sm" icon="i-heroicons-arrow-down-tray" />
            <UButton color="orange" variant="ghost" size="sm" icon="i-heroicons-arrow-up-tray" />
            <UButton color="red" variant="ghost" size="sm" icon="i-heroicons-trash" />
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500 mb-2">Pool Actions</div>
          <div class="flex flex-wrap gap-2">
            <UButton size="xs" color="purple" variant="soft" icon="i-heroicons-arrow-path-rounded-square">View Pool</UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- ColoredAddress Variants -->
    <section class="mb-8">
      <h2 class="text-lg font-title text-gray-800 dark:text-white mb-4">ColoredAddress Variants</h2>
      <div class="space-y-4">
        <div>
          <div class="text-xs text-gray-500 mb-2">Boxes (default)</div>
          <ColoredAddress address="rUjAsPvagJoctx1nmSM7yCf9BEPCKT4mEB" variant="boxes" />
        </div>
        <div>
          <div class="text-xs text-gray-500 mb-2">Bars</div>
          <div class="flex items-center gap-2">
            <ColoredAddress address="rUjAsPvagJoctx1nmSM7yCf9BEPCKT4mEB" variant="bars" />
            <span class="text-xs text-white font-mono">rUjAsPvagJoctx1nmSM7yCf9BEPCKT4mEB</span>
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500 mb-2">Text</div>
          <ColoredAddress address="rUjAsPvagJoctx1nmSM7yCf9BEPCKT4mEB" variant="text" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
</script>
