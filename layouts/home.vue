<template>
  <div>
    <div class="absolute top-4 right-4 z-10">
      <ColorMode />
    </div>
    <div class="flex h-screen">
      <div class="m-auto w-full text-center">
        <ShapesBackground />

        <slot />
      </div>
    </div>
  </div>
</template>
