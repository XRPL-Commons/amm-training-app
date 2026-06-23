import type { AMMInfoRequest, AMMInfoResponse } from 'xrpl'
import { GetUsers } from '~/server/connectors/memory'
import { getExplorerClient, convertPaddedHexToString } from '~/server/utils'

export default defineEventHandler(async (_event) => {
  const client = await getExplorerClient()

  try {
    const users = await GetUsers()
    // Only users who have created an AMM pool
    const poolUsers = users.filter(u => u.ammAccount && u.tokenCurrency && u.tokenIssuer)

    const poolResults = await Promise.allSettled(
      poolUsers.map(async (user) => {
        const ammRequest: AMMInfoRequest = {
          command: 'amm_info',
          amm_account: user.ammAccount!
        }
        const ammResponse: AMMInfoResponse = await client.request(ammRequest)
        const amm = ammResponse.result.amm

        // Normalize XRP amount (drops -> XRP)
        const xrpAmount = typeof amm.amount === 'string'
          ? (parseInt(amm.amount) / 1_000_000).toFixed(6)
          : '0'

        // Normalize token amount
        const tokenAmountObj = typeof amm.amount2 === 'object' ? amm.amount2 : null
        const tokenAmount = tokenAmountObj?.value || '0'

        // Decode currency display name from hex if needed
        const rawCurrency = tokenAmountObj?.currency || user.tokenCurrency || ''
        const displayCurrency = rawCurrency.length === 40 && !rawCurrency.startsWith('03')
          ? convertPaddedHexToString(rawCurrency)
          : rawCurrency

        return {
          participantName: user.name,
          participantAddress: user.xrplAddress,
          tokenCurrency: displayCurrency,
          tokenCurrencyRaw: rawCurrency,
          tokenIssuer: user.tokenIssuer!,
          ammAccount: user.ammAccount!,
          xrpReserve: xrpAmount,
          tokenReserve: tokenAmount,
          tradingFee: (amm.trading_fee / 1000).toFixed(3) + '%'
        }
      })
    )

    // Only return pools that were successfully fetched (ignore dead pools)
    const pools = poolResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)

    return pools
  } catch (e) {
    throw createError({
      status: 500,
      statusMessage: 'Failed to fetch participant pools'
    })
  } finally {
    await client.disconnect()
  }
})
