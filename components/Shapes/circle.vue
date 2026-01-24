<template>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="263" height="263">
    <path fill-rule="evenodd" :style="{ fill }" class="transition-[fill] duration-1000"
      d="M131.500,47.0 C178.168,47.0 215.999,84.831 215.999,131.500 C215.999,178.168 178.168,215.999 131.500,215.999 C84.831,215.999 47.0,178.168 47.0,131.500 C47.0,84.831 84.831,47.0 131.500,47.0 ZM131.500,0.0 C204.125,0.0 262.999,58.874 262.999,131.500 C262.999,204.125 204.125,262.999 131.500,262.999 C58.874,262.999 0.0,204.125 0.0,131.500 C0.0,58.874 58.874,0.0 131.500,0.0 Z" />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps(['fillColor'])
const fillColor = computed(() => props.fillColor)

const fill = ref(fillColor || "rgb(255, 26, 139)")
</script>