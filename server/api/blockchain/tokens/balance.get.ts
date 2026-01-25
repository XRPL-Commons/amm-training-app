import type { AccountLinesRequest, AccountLinesResponse } from 'xrpl'
import { convertPaddedHexToString, getExplorerClient } from '~/server/utils';

const getTokenBalance = async ({ xrplAddress, issuer, currency }: { xrplAddress: string, issuer: string, currency: string }) => {
  const client = await getExplorerClient();
  try {
    const accountLinesRequest: AccountLinesRequest = {
        command: 'account_lines',
        account: xrplAddress
    };
    const accountLinesResponse: AccountLinesResponse = await client.request(accountLinesRequest);

    // Try matching with hex-decoded currency first, then raw currency
    let token = accountLinesResponse.result.lines
        .filter(line => (convertPaddedHexToString(line.currency) === currency || line.currency === currency) && line.account === issuer)
        .map(line => ({
            currency: convertPaddedHexToString(line.currency),
            issuer: line.account,
            amount: line.balance
        }));

    return token;
  } catch(e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch token balance'
    })
  } finally {
    await client.disconnect();
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { xrplAddress, issuer, currency }: { xrplAddress: string, issuer: string, currency: string } = getQuery(event)
    return await getTokenBalance({ xrplAddress, issuer, currency })    
  } catch (e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch token balance'
    })
  }
})
