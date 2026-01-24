<template>
  <div
    class="text-xl px-4 py-1 w-full fixed top-0 right-0 left-0 z-20 border-transparent bg-transparent dark:bg-transparent text-gray-900 m-0">
    <div class="flex justify-between items-center content-center">
      <div class="flex justify-start items-center">
        <NuxtLink to="/" class=" text-stratos-950 text-xl sm:text-3xl rounded-full px-0 py-1 font-title inline-block">
          <div class="hover:scale-110 p-2 transition-all cursor-pointer flex justify-start items-center flex-auto ">
            <img src="/xrpl.png" class="h-8 opacity-80 hidden dark:block" />
            <img src="/xrplb.png" class="h-8 opacity-80 dark:invisible dark:hidden" />
          </div>
        </NuxtLink>
      </div>

      <div class="pl-1 flex">
        <ColorMode />
      </div>
    </div>
  </div>
  <ShapesBackground />

  <div class="pt-20 pr-4 pl-4 sm:pr-4 sm:pl-4 relative">
    <slot />
  </div>

</template>
