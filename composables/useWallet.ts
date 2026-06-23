import { useTrainingProgress } from './useTrainingProgress'
import { computed } from 'vue'

interface WalletToken {
  currency: string
  currencyRaw?: string
  issuer: string
  amount: string
  limit: string
  isLPToken: boolean
  isHexEncoded?: boolean
}

export function useWallet() {
  const { userWallet, issuerWallet } = useTrainingProgress()

  const walletTokens = useState<WalletToken[]>('wallet_tokens', () => [])
  const walletXrpBalance = useState<string>('wallet_xrp_balance', () => '0')
  const treasuryXrpBalance = useState<string>('treasury_xrp_balance', () => '0')
  const walletDataLoading = useState<boolean>('wallet_data_loading', () => false)
  const walletDataInitialized = useState<boolean>('wallet_data_initialized', () => false)
  const currentUser = useState<{ name: string; xrplAddress: string } | null>('current_user', () => null)

  const xrplAddress = computed(() => userWallet.value?.address || '')
  const isConnected = computed(() => !!xrplAddress.value)

  async function loadFromStorage() {
    // Rely on useTrainingProgress to load, just refresh data if address exists
    if (xrplAddress.value) {
      await refreshWalletData()
    }
  }

  // Load/refresh the connected user's token data
  async function refreshWalletData() {
    if (!xrplAddress.value) return

    walletDataLoading.value = true
    try {
      const config = useRuntimeConfig()
      const { Client } = await import('xrpl')
      const client = new Client(config.public.wssExplorer || 'wss://s.altnet.rippletest.net:51233')
      await client.connect()

      try {
        const [linesResponse, accountInfo] = await Promise.all([
          client.request({ command: 'account_lines', account: xrplAddress.value }),
          client.request({ command: 'account_info', account: xrplAddress.value })
        ])

        const mappedTokens: WalletToken[] = linesResponse.result.lines.map((line: any) => ({
          currency: line.currency,
          issuer: line.account,
          amount: line.balance,
          limit: line.limit,
          isLPToken: line.currency.length === 40 && line.currency.startsWith('03')
        }))

        walletTokens.value = mappedTokens
        const drops = accountInfo.result.account_data.Balance || '0'
        walletXrpBalance.value = (parseInt(drops) / 1_000_000).toString()

        // Fetch treasury balance if available
        if (issuerWallet.value?.address) {
          try {
            const issuerInfo = await client.request({ command: 'account_info', account: issuerWallet.value.address })
            const issuerDrops = issuerInfo.result.account_data.Balance || '0'
            treasuryXrpBalance.value = (parseInt(issuerDrops) / 1_000_000).toString()
          } catch (e) {
            treasuryXrpBalance.value = '0'
          }
        }

        walletDataInitialized.value = true
      } catch (err: any) {
        if (err.message && (err.message.includes('actNotFound') || err.message.includes('Account not found'))) {
          walletXrpBalance.value = '0'
          walletTokens.value = []
        } else {
          console.error('XRPL Fetch error:', err)
        }
      } finally {
        await client.disconnect()
      }
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

  function getXrpBalance(): string {
    return walletXrpBalance.value
  }

  async function connectWallet() {
    // No-op for legacy compatibility.
    // The new flow uses pages/training/setup.vue to generate wallets.
    return Promise.resolve(xrplAddress.value)
  }

  function disconnectWallet() {
    currentUser.value = null
    walletTokens.value = []
    walletXrpBalance.value = '0'
    walletDataInitialized.value = false
  }

  function setCurrentUser(user: { name: string; xrplAddress: string } | null) {
    currentUser.value = user
  }

  return {
    xrplAddress,
    currentUser,
    isConnected,
    // Wallet token data
    walletTokens: readonly(walletTokens),
    walletXrpBalance: readonly(walletXrpBalance),
    treasuryXrpBalance: readonly(treasuryXrpBalance),
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
