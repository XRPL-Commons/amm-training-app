import API from '~/server/client'

interface Token {
  currency: string
  issuer: string
  amount: string
  limit: string
  isLPToken: boolean
  hasAmm?: boolean
}

interface PoolInfo {
  asset1: { currency: string; amount: string; issuer?: string }
  asset2: { currency: string; amount: string; issuer?: string }
  tradingFee: string
  account: string
}

interface LPTokenWithPool extends Token {
  poolInfo?: PoolInfo | null
}

interface UserDetails {
  tokens: Token[]
  lpTokensWithPool: LPTokenWithPool[]
  accountInfo: any
  initialized: boolean
}

// Reactive cache of user details keyed by xrplAddress
const cache = reactive<Record<string, UserDetails>>({})
const loadingAddresses = reactive<Set<string>>(new Set())

export function useUserDetails() {
  function getDetails(xrplAddress: string): UserDetails | null {
    return cache[xrplAddress] || null
  }

  function isLoading(xrplAddress: string): boolean {
    return loadingAddresses.has(xrplAddress)
  }

  function hasDetails(xrplAddress: string): boolean {
    return xrplAddress in cache
  }

  async function loadDetails(xrplAddress: string, forceRefresh = false): Promise<UserDetails | null> {
    // Return cached if available and not forcing refresh
    if (!forceRefresh && cache[xrplAddress]?.initialized) {
      return cache[xrplAddress]
    }

    // Mark as loading
    loadingAddresses.add(xrplAddress)

    try {
      const [tokensResult, accountResult] = await Promise.all([
        API.getTokens({ xrplAddress }),
        API.getAccountInfo({ xrplAddress })
      ])

      // Check AMM existence for regular tokens
      const regularTokens = tokensResult.filter((t: Token) => !t.isLPToken)
      const ammCheckPromises = regularTokens.map(async (token: Token) => {
        try {
          const amm = await API.getAmm({ issuer: token.issuer, currency: token.currency })
          return { ...token, hasAmm: !!amm }
        } catch {
          return { ...token, hasAmm: false }
        }
      })
      const tokensWithAmmCheck = await Promise.all(ammCheckPromises)

      // Combine with LP tokens
      const lpTokens = tokensResult.filter((t: Token) => t.isLPToken)
      const allTokens = [...tokensWithAmmCheck, ...lpTokens]

      // Update cache reactively - this will trigger UI updates
      cache[xrplAddress] = {
        tokens: allTokens,
        lpTokensWithPool: [],
        accountInfo: accountResult,
        initialized: true
      }

      // Fetch pool info for LP tokens (continues in background)
      if (lpTokens.length > 0) {
        const poolInfoPromises = lpTokens.map(async (token: Token) => {
          const poolInfo = await API.getAmmByAccount({ ammAccount: token.issuer })
          return { ...token, poolInfo }
        })
        const lpResults = await Promise.all(poolInfoPromises)

        // Update cache with LP pool info - reactive update
        if (cache[xrplAddress]) {
          cache[xrplAddress].lpTokensWithPool = lpResults
        }
      }

      return cache[xrplAddress] || null
    } catch (error) {
      console.error('Failed to load user details:', error)
      return null
    } finally {
      loadingAddresses.delete(xrplAddress)
    }
  }

  function clearCache(xrplAddress?: string) {
    if (xrplAddress) {
      delete cache[xrplAddress]
    } else {
      Object.keys(cache).forEach(key => delete cache[key])
    }
  }

  // Refresh tokens after trustline change
  async function refreshTokens(xrplAddress: string): Promise<void> {
    await loadDetails(xrplAddress, true)
  }

  return {
    cache: readonly(cache),
    loadingAddresses: readonly(loadingAddresses),
    getDetails,
    isLoading,
    hasDetails,
    loadDetails,
    refreshTokens,
    clearCache
  }
}
