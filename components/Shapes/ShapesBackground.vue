<template>
  <div
    class="blur-3xl -z-10 fixed w-full top-0 right-0 bottom-0 left-0 overflow-hidden grid grid-flow-row-dense grid-cols-3 grid-rows-3">

    <template v-for="{ shape, color } in shapesAndColors">
      <div class="inline-block animatedDiv">
        <component :is="shape" v-bind="{ fillColor: color }" />
      </div>
      <br />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { ShapesSquigle, ShapesSwoosh, ShapesStar, ShapesLine, ShapesCircle } from '#components'

const defaultColors = inject('defaultColors')
const updateColors = inject('updateColors', () => { })

const shuffle = (list) => {
  return list
    .map(x => [Math.random(), x])
    .sort(([a], [b]) => a - b)
    .map(([_, x]) => x)
}

// shuffle colors
const colors = computed(() => shuffle(defaultColors.value))

const shapes = shuffle([ShapesSquigle, ShapesSwoosh, ShapesStar, ShapesLine, ShapesCircle])
const shapesAndColors = computed(() => shapes.map((shape, i) => ({ shape, color: colors.value[i] })))

// onMounted(() => {
//   setInterval(() => {
//     updateColors(shuffle(colors.value))
//     console.log('updating colors', colors.value)
//     console.log(shapesAndColors.value)
//   }, 3000)
// })
</script>

<style>
@keyframes growAndMove {

  0%,
  100% {
    /* Start and end in the center, including rotation back to 0 degrees */
    transform: translate(150px, 150px) scale(1) rotate(0deg);
  }

  50% {
    /* Move, grow, and rotate at the midpoint */
    transform: translate(300px, 300px) scale(2) rotate(360deg);
  }
}

.animatedDiv {
  position: relative;
  /* Needed for centering, adjust as per your layout */
  animation: growAndMove 150s infinite alternate;
}
</style>