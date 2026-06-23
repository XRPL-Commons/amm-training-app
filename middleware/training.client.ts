export default defineNuxtRouteMiddleware((to, from) => {
  const { currentStep, isLoaded, loadProgress } = useTrainingProgress()

  if (!isLoaded.value) {
    loadProgress()
  }

  const stepMap: Record<string, number> = {
    '/training/setup': 1,
    '/training/issue': 2,
    '/training/pool': 3,
    '/training/swap': 4
  }

  const targetStep = stepMap[to.path]

  if (targetStep) {
    if (targetStep > currentStep.value) {
      // Redirect to highest unlocked step
      const stepPaths = ['/training/setup', '/training/issue', '/training/pool', '/training/swap']
      return navigateTo(stepPaths[currentStep.value - 1])
    }
  }
})
