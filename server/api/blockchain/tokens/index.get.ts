import { GetUsers } from '~/server/connectors/memory'
import type { AccountLinesRequest, AccountLinesResponse } from 'xrpl'
import { convertPaddedHexToString, getExplorerClient } from '~/server/utils';

const getTokens = async ({ xrplAddress }: { xrplAddress: string }) => {
  // list existing users
  const client = await getExplorerClient();
  console.log("connection")
  try {
    const accountLinesRequest: AccountLinesRequest = {
        command: 'account_lines',
        account: xrplAddress
    };        
    const accountLinesResponse: AccountLinesResponse = await client.request(accountLinesRequest);
    console.log(accountLinesResponse.result.lines)
    const tokens = accountLinesResponse.result.lines.map(line => ({
        currency: convertPaddedHexToString(line.currency),
        issuer: line.account,
        amount: line.balance
    }));

    console.log('Tokens:', tokens);
    return tokens;
  } catch(e) {
    console.log("Error:")
    console.log(e)
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
    console.error(e)
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch tokens'
    })
  }
})
