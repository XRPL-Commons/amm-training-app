import type { AMMInfoRequest, AMMInfoResponse } from 'xrpl'
import { convertPaddedHexToString, getExplorerClient } from '~/server/utils';

const getAmmByAccount = async ({ ammAccount }: { ammAccount: string }) => {
  const client = await getExplorerClient();
  try {
    const ammRequest: AMMInfoRequest = {
      command: 'amm_info',
      amm_account: ammAccount
    };
    const ammResponse: AMMInfoResponse = await client.request(ammRequest);

    const amm = {
      asset1: normalizeAmount(ammResponse.result.amm.amount),
      asset2: normalizeAmount(ammResponse.result.amm.amount2),
      tradingFee: (ammResponse.result.amm.trading_fee / 100).toFixed(2) + '%',
      account: ammResponse.result.amm.account
    };

    return amm
  } catch (e) {
    return null
  } finally {
    await client.disconnect();
  }
}

export default defineEventHandler(async (event) => {
  const { ammAccount }: { ammAccount: string } = getQuery(event)
  return await getAmmByAccount({ ammAccount })
})

function normalizeAmount(amount: any) {
  if (typeof amount === 'string') {
    return {
      currency: 'XRP',
      amount: (parseInt(amount) / 1000000).toString(),
    };
  } else if (typeof amount === 'object' && amount !== null) {
    return {
      currency: convertPaddedHexToString(amount.currency),
      amount: amount.value,
      issuer: amount.issuer,
    };
  }
  return null
}
