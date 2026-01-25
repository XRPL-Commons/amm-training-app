import { UpdateUser } from '~/server/connectors/memory'
import { getExplorerClient, convertPaddedHexToString } from '~/server/utils'
import type { AccountLinesRequest, AccountLinesResponse } from 'xrpl'

async function getTokenStats(xrplAddress: string) {
  const client = await getExplorerClient()
  try {
    const accountLinesRequest: AccountLinesRequest = {
      command: 'account_lines',
      account: xrplAddress
    }
    const response: AccountLinesResponse = await client.request(accountLinesRequest)
    const lines = response.result.lines

    let tokenCount = 0
    let poolCount = 0

    for (const line of lines) {
      // LP tokens have 40-character hex currency codes starting with '03'
      const isLPToken = line.currency.length === 40 && line.currency.startsWith('03')
      if (isLPToken) {
        poolCount++
      } else {
        tokenCount++
      }
    }

    return { tokenCount, poolCount }
  } catch (e) {
    return { tokenCount: 0, poolCount: 0 }
  } finally {
    await client.disconnect()
  }
}

export default defineEventHandler(async (event) => {
  const address = getRouterParam(event, 'address')

  if (!address) {
    throw createError({ statusCode: 400, statusMessage: 'Address required' })
  }

  const stats = await getTokenStats(address)

  // Update user in memory if they exist
  await UpdateUser(address, stats)

  return { xrplAddress: address, ...stats }
})
