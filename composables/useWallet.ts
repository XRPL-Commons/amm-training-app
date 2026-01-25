import API from '~/server/client'

interface WalletToken {
  currency: string
  currencyRaw?: string
  issuer: string
  amount: string
  limit: string
  isLPToken: boolean
  isHexEncoded?: boolean
}

const userToken = ref('')
const xrplAddress = ref('')
const currentUser = ref<{ name: string; xrplAddress: string } | null>(null)

// Connected user's token/trustline data
const walletTokens = ref<WalletToken[]>([])
const walletXrpBalance = ref('0')
const walletDataLoading = ref(false)
const walletDataInitialized = ref(false)

export function useWallet() {
  const modal = useModal()

  const isConnected = computed(() => !!xrplAddress.value)

  async function loadFromStorage() {
    if (typeof window !== 'undefined') {
      userToken.value = localStorage.getItem('user_token') || ''
      xrplAddress.value = localStorage.getItem('xrpl_address') || ''
      // Load wallet data if connected
      if (xrplAddress.value) {
        await refreshWalletData()
      }
    }
  }

  // Load/refresh the connected user's token data
  async function refreshWalletData() {
    if (!xrplAddress.value) return

    walletDataLoading.value = true
    try {
      const [tokens, accountInfo] = await Promise.all([
        API.getTokens({ xrplAddress: xrplAddress.value }),
        API.getAccountInfo({ xrplAddress: xrplAddress.value })
      ])

      walletTokens.value = tokens
      const drops = accountInfo?.result?.account_data?.Balance || '0'
      walletXrpBalance.value = (parseInt(drops) / 1_000_000).toString()
      walletDataInitialized.value = true
    } catch (error) {
      console.error('Failed to load wallet data:', error)
    } finally {
      walletDataLoading.value = false
    }
  }

  // Get the connected user's trustline for a specific token
  function getTrustlineFor(currency: string, issuer: string): WalletToken | undefined {
    return walletTokens.value.find(t =>
      t.currency === currency && t.issuer === issuer && !t.isLPToken
    )
  }

  // Get XRP balance
  function getXrpBalance(): string {
    return walletXrpBalance.value
  }

  async function connectWallet(QRCodeModal?: any) {
    // Dynamically import if not provided
    if (!QRCodeModal) {
      const components = await import('../components/QRCodeModal.vue')
      QRCodeModal = components.default
    }

    return new Promise(async (resolve, reject) => {
      try {
        const payload = await API.XamanSignIn()

        modal.open(QRCodeModal, {
          qrCodeSrc: payload.refs.qr_png,
          mobileUrl: payload.next.always
        })

        const ws = new WebSocket(payload.refs.websocket_status)
        ws.onmessage = async (message) => {
          const responseObj = JSON.parse(message.data)
          const { signed, payload_uuidv4 } = responseObj

          if (signed !== true || !payload_uuidv4) return

          const data: any = await API.XamanGetPayload({ uuid: payload_uuidv4 })

          const runtimeConfig = useRuntimeConfig()
          if (data.response.environment_nodetype !== runtimeConfig.public.network) {
            alert('Wrong network: please use ' + runtimeConfig.public.network)
            modal.close()
            ws.close()
            reject(new Error('Wrong network'))
            return
          }

          if (data.payload.tx_type === 'SignIn') {
            xrplAddress.value = data.response.account
            userToken.value = data.application.issued_user_token
            localStorage.setItem('xrpl_address', xrplAddress.value)
            localStorage.setItem('user_token', userToken.value)
            modal.close()
            ws.close()
            // Load wallet data after connection
            await refreshWalletData()
            resolve(xrplAddress.value)
          }
        }
      } catch (error) {
        alert('Error connecting to Xaman: ' + error)
        reject(error)
      }
    })
  }

  function disconnectWallet() {
    userToken.value = ''
    xrplAddress.value = ''
    currentUser.value = null
    walletTokens.value = []
    walletXrpBalance.value = '0'
    walletDataInitialized.value = false
    localStorage.removeItem('user_token')
    localStorage.removeItem('xrpl_address')
  }

  function setCurrentUser(user: { name: string; xrplAddress: string } | null) {
    currentUser.value = user
  }

  return {
    userToken,
    xrplAddress,
    currentUser,
    isConnected,
    // Wallet token data
    walletTokens: readonly(walletTokens),
    walletXrpBalance: readonly(walletXrpBalance),
    walletDataLoading: readonly(walletDataLoading),
    walletDataInitialized: readonly(walletDataInitialized),
    // Functions
    loadFromStorage,
    connectWallet,
    disconnectWallet,
    setCurrentUser,
    refreshWalletData,
    getTrustlineFor,
    getXrpBalance
  }
}
