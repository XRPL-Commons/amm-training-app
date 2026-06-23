import { GetUsers, UpdateUser } from '~/server/connectors/memory'
import { getExplorerClient } from '~/server/utils'
import { decodeCurrency } from '~/utils/currency'
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
      const currency = decodeCurrency(line.currency)
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
  const users = await GetUsers()

  // Update stats for all users in parallel
  const updates = await Promise.all(
    users.map(async (user) => {
      const stats = await getTokenStats(user.xrplAddress)
      await UpdateUser(user.xrplAddress, stats)
      return { xrplAddress: user.xrplAddress, ...stats }
    })
  )

  return { updated: updates.length, users: await GetUsers() }
})
