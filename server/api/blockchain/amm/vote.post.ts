import { getXumm } from "~/server/utils";

interface VoteParams {
  userToken: string
  account: string
  asset1: { currency: string; issuer?: string }
  asset2: { currency: string; issuer?: string }
  tradingFee: number  // Fee in basis points (0-1000, where 1000 = 1%)
}

const voteAmmFee = async (params: VoteParams) => {
  const { userToken, account, asset1, asset2, tradingFee } = params

  if (!userToken) {
    throw createError({
      status: 400,
      statusMessage: 'missing user token'
    })
  }

  // Validate trading fee is in valid range (0-1000 basis points = 0-1%)
  if (tradingFee < 0 || tradingFee > 1000) {
    throw createError({
      status: 400,
      statusMessage: 'Trading fee must be between 0 and 1000 (0% to 1%)'
    })
  }

  try {
    const xumm = getXumm();
    await xumm?.ping();

    // Build Asset specification for AMM
    const Asset: any = asset1.currency === 'XRP'
      ? { currency: 'XRP' }
      : { currency: asset1.currency, issuer: asset1.issuer }

    const Asset2: any = asset2.currency === 'XRP'
      ? { currency: 'XRP' }
      : { currency: asset2.currency, issuer: asset2.issuer }

    const txjson: any = {
      TransactionType: "AMMVote",
      Account: account,
      Asset,
      Asset2,
      TradingFee: tradingFee  // In basis points (1/100th of a percent)
    }

    console.log('[AMM Vote Debug] Transaction:', JSON.stringify(txjson, null, 2))

    const payload = await xumm.payload?.create({
      user_token: userToken,
      txjson: txjson
    } as any, true);

    return payload;
  } catch (error: any) {
    console.error('[AMM Vote Error]', error)
    throw createError({
      status: 500,
      statusMessage: 'Failed to create AMM vote payload'
    })
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await voteAmmFee(body)
})
