import API from '~/server/client'

const userToken = ref('')
const xrplAddress = ref('')
const currentUser = ref<{ name: string; xrplAddress: string } | null>(null)

export function useWallet() {
  const modal = useModal()

  const isConnected = computed(() => !!xrplAddress.value)

  async function loadFromStorage() {
    if (typeof window !== 'undefined') {
      userToken.value = localStorage.getItem('user_token') || ''
      xrplAddress.value = localStorage.getItem('xrpl_address') || ''
    }
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
    loadFromStorage,
    connectWallet,
    disconnectWallet,
    setCurrentUser
  }
}
