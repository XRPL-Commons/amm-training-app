import type { AccountLinesRequest, AccountLinesResponse, AMMInfoRequest, AMMInfoResponse, BookOffersRequest, BookOffersResponse } from 'xrpl'
import { convertPaddedHexToString, convertStringToHexPadded, getExplorerClient } from '~/server/utils';

const getAmm = async ({ issuer, currency }: { issuer: string, currency: string }) => {
  const client = await getExplorerClient();
  try {
    // If currency is already in raw format (3-char standard or 40-char hex), use it directly
    // Otherwise convert to hex (for backwards compatibility)
    const currencyForRequest = (currency.length === 3 || currency.length === 40)
      ? currency
      : convertStringToHexPadded(currency);

    const ammRequest: AMMInfoRequest = {
        command: 'amm_info',
        asset: {
            currency: currencyForRequest,
            issuer: issuer
        },
        asset2: {
            currency: 'XRP'
        },
    };
    const ammResponse: AMMInfoResponse = await client.request(ammRequest);

    const lpHoldersRequest: AccountLinesRequest = {
      command: 'account_lines',
      account: ammResponse.result.amm.lp_token.issuer
    }
    const obResponse: AccountLinesResponse = await client.request(lpHoldersRequest);

    const totalLpToken = parseInt(ammResponse.result.amm.lp_token.value);

    const amm = {
        pool1: normalizeAmount(ammResponse.result.amm.amount),
        pool2: normalizeAmount(ammResponse.result.amm.amount2),
        trading_fee: (ammResponse.result.amm.trading_fee / 100).toFixed(2) + '%',
        lpToken: {
            issuer: ammResponse.result.amm.lp_token.issuer,
            amount: ammResponse.result.amm.lp_token.value,
            currency: convertPaddedHexToString(ammResponse.result.amm.lp_token.currency),
            currencyRaw: ammResponse.result.amm.lp_token.currency, // Keep raw hex for LP tokens (starts with 03)
            holders: obResponse.result.lines
              .filter(line => line.currency === ammResponse.result.amm.lp_token.currency)
              .map(holder => ({
                account: holder.account,
                amount: Math.abs(parseInt(holder.balance)),
                share: totalLpToken > 0 ? ((Math.abs(parseInt(holder.balance)) / totalLpToken) * 100).toFixed(2) + '%' : '0%'
              })),
        },
        id: ammResponse.result.amm.account
    };    

    await client.disconnect();

    return amm
  } catch(e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch amm'
    })
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { issuer, currency }: { issuer: string, currency: string } = getQuery(event)
    return await getAmm({ issuer, currency })    
  } catch (e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch tokens'
    })
  }
})

function normalizeAmount(amount: any) {
    if (typeof amount === 'string') {
        return {
            currency: 'XRP',
            currencyRaw: 'XRP', // XRP is always just 'XRP'
            amount: (parseInt(amount) / 1000000).toString(),
            issuer: 'XRP',
        };
    } else if (typeof amount === 'object' && amount !== null) {
        return {
            currency: convertPaddedHexToString(amount.currency),
            currencyRaw: amount.currency, // Preserve original format for transactions
            amount: amount.value,
            issuer: amount.issuer
        };
    } else {
        throw new Error('Invalid amount format');
    }
}