import { GetUsers } from '~/server/connectors/mongo'
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
    const tokens = accountLinesResponse.result.lines.map(line => ({
        currency: convertPaddedHexToString(line.currency),
        issuer: line.account,
        amount: line.balance
    }));

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
