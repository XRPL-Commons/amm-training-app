<template>
  <span v-if="variant === 'text'" class="font-mono">
    <span
      v-for="(char, index) in address"
      :key="index"
      :style="{ color: getColorForChar(char) }"
    >{{ char }}</span>
  </span>
  <div v-else-if="variant === 'bars'" class="inline-flex h-4 rounded-sm overflow-hidden">
    <span
      v-for="(char, index) in address"
      :key="index"
      class="w-[2px] h-full"
      :style="{ backgroundColor: getColorForChar(char) }"
    />
  </div>
  <div v-else class="inline-flex">
    <span
      v-for="(char, index) in address"
      :key="index"
      class="inline-flex items-center justify-center w-[7px] h-3 text-[8px] font-mono font-medium first:rounded-l last:rounded-r"
      :style="{
        backgroundColor: getColorForChar(char),
        color: '#fff'
      }"
    >
      {{ char }}
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  address: string
  variant?: 'boxes' | 'text' | 'bars'
}>(), {
  variant: 'boxes'
})

// All possible base58 characters (XRPL uses base58)
const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// Pre-generate colors with hue for each character
const charHueMap = new Map<string, number>()
chars.split('').forEach((char, index) => {
  const hue = (index * 360) / chars.length
  charHueMap.set(char, hue)
})

function getColorForChar(char: string): string {
  const hue = charHueMap.get(char) ?? 0
  if (props.variant === 'bars') {
    return `hsl(${hue}, 70%, 50%)`
  }
  return `hsl(${hue}, 55%, 28%)`
}

function getTextColor(char: string): string {
  return '#fff'
}
</script>
