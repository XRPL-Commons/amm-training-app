<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UModals />
  <UNotifications />
</template>

<script setup lang="ts">

// Background shapes for UI/UX design
import { ref, provide, readonly } from 'vue'

const shuffle = (list: any) => {
  return list    
    .map((x: unknown) => [Math.random(), x] as [number, unknown])
    .sort(([a]: any, [b]: any) => a - b)
    .map(([_, x]: any) => x)
}

const colors = ref([
  "rgb(255, 26, 139)",
  "rgb(25, 255, 131)",
  "rgb(255, 103, 26)",
  "rgb(26, 164, 255)",
  "rgb(250, 255, 26)"
])

const updateColors = (newColors: any) => {
  if (newColors.length >= 5) {
    colors.value = shuffle(newColors).slice(0, 5);
  } else {
    let filledArray: any[] = [];
    while (filledArray.length < 5) {
      filledArray = filledArray.concat(newColors);
    }
    colors.value = filledArray.slice(0, 5);
  }
}

provide('defaultColors', colors)
provide('updateColors', updateColors)
</script>