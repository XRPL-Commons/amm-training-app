<template>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="228px" height="219px">
    <path fill-rule="evenodd" :style="{ fill }" class="transition-[fill] duration-1000"
      d="M194.0,0.0 C205.332,11.332 216.667,22.667 228.0,33.999 C227.666,34.666 227.333,35.333 227.0,36.0 C162.339,96.993 97.660,158.6 32.999,218.999 C32.0,218.666 30.999,218.333 29.999,217.999 C20.0,206.334 9.998,194.665 0.0,182.999 C64.660,122.6 129.339,60.993 194.0,0.0 Z" />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps(['fillColor'])
const fillColor = computed(() => props.fillColor)

const fill = ref(fillColor || "rgb(25, 255, 131)")
</script>