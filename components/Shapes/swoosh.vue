<template><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="546" height="221">
    <path fill-rule="evenodd" :style="{ fill }" class="transition-[fill] duration-1000"
      d="M30.999,0.0 C131.446,88.488 201.220,153.178 227.0,163.0 C257.846,174.752 304.845,170.361 331.0,158.0 C371.662,138.780 488.114,22.910 513.999,0.0 C514.666,0.333 515.333,0.666 515.999,1.0 C525.998,12.332 536.0,23.667 545.999,35.0 C545.999,35.666 545.999,36.333 545.999,36.999 C531.1,50.332 515.998,63.668 501.0,77.0 C453.514,116.362 410.851,168.516 355.999,198.999 C203.941,283.505 79.871,95.428 0.0,36.999 C0.333,35.666 0.666,34.333 0.999,33.0 C10.998,22.1 21.1,10.998 30.999,0.0 Z" />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps(['fillColor'])
const fillColor = computed(() => props.fillColor)

const fill = ref(fillColor || "rgb(250, 255, 26)")
</script>