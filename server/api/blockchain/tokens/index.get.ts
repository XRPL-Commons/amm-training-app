import { GetUsers } from '~/server/connectors/memory'
import type { AccountLinesRequest, AccountLinesResponse } from 'xrpl'
import { convertPaddedHexToString, getExplorerClient } from '~/server/utils';

const getTokens = async ({ xrplAddress }: { xrplAddress: string }) => {
  // list existing users
  const client = await getExplorerClient();
  try {
    const accountLinesRequest: AccountLinesRequest = {
        command: 'account_lines',
        account: xrplAddress
    };        
    const accountLinesResponse: AccountLinesResponse = await client.request(accountLinesRequest);
    const tokens = accountLinesResponse.result.lines.map(line => {
        // LP tokens start with "03" in hex format and are 40 chars
        const isLPToken = line.currency.length === 40 && line.currency.startsWith('03')
        return {
            currency: convertPaddedHexToString(line.currency),
            issuer: line.account,
            amount: line.balance,
            limit: line.limit,
            isLPToken
        }
    });

    return tokens;
  } catch(e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch tokens'
    })
  } finally {
    await client.disconnect();
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { xrplAddress }: { xrplAddress: any } = getQuery(event)
    return await getTokens({ xrplAddress })    
  } catch (e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch tokens'
    })
  }
})
