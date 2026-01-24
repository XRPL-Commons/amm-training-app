<template>
  <div class="w-full">

    <div class="rounded-full bg-transparent p-2 transition-all flex justify-center items-center mt-20">
      <img src="/xrpl.png" class="h-10 opacity-80 hidden dark:block" />
      <img src="/xrplb.png" class="h-10 opacity-80 dark:invisible dark:hidden" />
      <div class=" ml-2 md:text-4xl text-xl font-title text-black dark:text-white">Community Trainings
      </div>
    </div>
    <br />
    <div class="text-center">
      <div class="w-lg inline-block text-lg text-gray-600 dark:text-gray-300">
        <p class="font-title text-md m-6">Welcome to the XRPL Commons NuxtJS template.</p>
        <p class="font-title text-md m-8">
          Here you will find everything you need to start interacting with Xaman wallet.<br/>
          Click the button below to enter the training and connect your wallet.
        </p>        
        <UButton label="Enter the class" @click="submit" size="lg" class="font-title" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

definePageMeta({
  layout: 'home'
})

const submit = async () => {  
  try {
    router.push('/training')
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
})
</script>

<style>
/* Shake keyframe animation */
@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-10px);
  }

  20%,
  40%,
  60%,
  80% {
    transform: translateX(10px);
  }
}

/* Class that applies the shake animation and red border */
.input-error {
  animation: shake 0.82s cubic-bezier(.36, .07, .19, .97) both;
}
</style>