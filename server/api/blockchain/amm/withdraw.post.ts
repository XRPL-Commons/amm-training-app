import { AMMWithdrawFlags } from "xrpl";
import { getXumm } from "~/server/utils";

interface WithdrawParams {
  userToken: string
  account: string
  asset1: { currency: string; issuer?: string }
  asset2: { currency: string; issuer?: string }
  lpTokenIn?: string  // Amount of LP tokens to burn
  lpTokenCurrency: string  // LP token currency code
  lpTokenIssuer: string  // LP token issuer (AMM account)
  amount1?: string  // Desired amount of asset1 (for single-sided)
  singleSided?: boolean
  withdrawAll?: boolean
}

const withdrawAmm = async (params: WithdrawParams) => {
  const { userToken, account, asset1, asset2, lpTokenIn, lpTokenCurrency, lpTokenIssuer, amount1, singleSided, withdrawAll } = params

  if (!userToken) {
    throw createError({
      status: 400,
      statusMessage: 'missing user token'
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
      TransactionType: "AMMWithdraw",
      Account: account,
      Asset,
      Asset2,
    }

    if (withdrawAll) {
      // Withdraw all liquidity
      txjson.Flags = AMMWithdrawFlags.tfWithdrawAll
    } else if (singleSided && amount1) {
      // Single-sided withdraw - withdraw only one asset
      txjson.Flags = AMMWithdrawFlags.tfOneAssetWithdrawAll

      if (asset1.currency === 'XRP') {
        txjson.Amount = Math.floor(parseFloat(amount1) * 1000000).toString()
      } else {
        txjson.Amount = {
          currency: asset1.currency,
          issuer: asset1.issuer,
          value: amount1
        }
      }
    } else if (lpTokenIn) {
      // LP Token-based withdraw - specify LP tokens to burn
      txjson.Flags = AMMWithdrawFlags.tfLPToken
      txjson.LPTokenIn = {
        currency: lpTokenCurrency,
        issuer: lpTokenIssuer,
        value: lpTokenIn
      }
    }

    console.log('[AMM Withdraw Debug] Transaction:', JSON.stringify(txjson, null, 2))

    const payload = await xumm.payload?.create({
      user_token: userToken,
      txjson: txjson
    } as any, true);

    return payload;
  } catch (error: any) {
    console.error('[AMM Withdraw Error]', error)
    throw createError({
      status: 500,
      statusMessage: 'Failed to create AMM withdraw payload'
    })
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await withdrawAmm(body)
})
