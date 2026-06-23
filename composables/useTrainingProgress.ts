import { computed } from 'vue'

interface WalletInfo {
  address: string
  seed: string
}

interface TokenInfo {
  currency: string
  issuer: string
}

export const useTrainingProgress = () => {
  // Use Nuxt useState to prevent cross-request state pollution during SSR
  const currentStep = useState<number>('training_step', () => 1)
  const issuerWallet = useState<WalletInfo | null>('training_issuer', () => null)
  const userWallet = useState<WalletInfo | null>('training_user', () => null)
  const customToken = useState<TokenInfo | null>('training_token', () => null)
  const isLoaded = useState<boolean>('training_loaded', () => false)

  // Load from local storage
  const loadProgress = () => {
    if (import.meta.server) return // Ensure this only runs on client
    
    const storedStep = localStorage.getItem('training_step')
    if (storedStep) currentStep.value = parseInt(storedStep)

    const storedIssuer = localStorage.getItem('training_issuer')
    if (storedIssuer) issuerWallet.value = JSON.parse(storedIssuer)

    const storedUser = localStorage.getItem('training_user')
    if (storedUser) userWallet.value = JSON.parse(storedUser)

    const storedToken = localStorage.getItem('training_token')
    if (storedToken) customToken.value = JSON.parse(storedToken)
    
    isLoaded.value = true
  }

  const saveProgress = () => {
    if (import.meta.server) return
    
    localStorage.setItem('training_step', currentStep.value.toString())
    if (issuerWallet.value) localStorage.setItem('training_issuer', JSON.stringify(issuerWallet.value))
    if (userWallet.value) localStorage.setItem('training_user', JSON.stringify(userWallet.value))
    if (customToken.value) localStorage.setItem('training_token', JSON.stringify(customToken.value))
  }

  const setStep = (step: number) => {
    currentStep.value = step
    saveProgress()
  }

  const unlockNextStep = () => {
    if (currentStep.value < 4) {
      currentStep.value++
      saveProgress()
    }
  }

  const setIssuerWallet = (wallet: WalletInfo) => {
    issuerWallet.value = wallet
    saveProgress()
  }

  const setUserWallet = (wallet: WalletInfo) => {
    userWallet.value = wallet
    saveProgress()
  }

  const setCustomToken = (token: TokenInfo) => {
    customToken.value = token
    saveProgress()
  }

  const resetProgress = () => {
    currentStep.value = 1
    issuerWallet.value = null
    userWallet.value = null
    customToken.value = null
    if (import.meta.client) {
      localStorage.removeItem('training_step')
      localStorage.removeItem('training_issuer')
      localStorage.removeItem('training_user')
      localStorage.removeItem('training_token')
    }
  }

  return {
    isLoaded,
    currentStep: computed(() => currentStep.value),
    issuerWallet: computed(() => issuerWallet.value),
    userWallet: computed(() => userWallet.value),
    customToken: computed(() => customToken.value),
    loadProgress,
    setStep,
    unlockNextStep,
    setIssuerWallet,
    setUserWallet,
    setCustomToken,
    resetProgress
  }
}
