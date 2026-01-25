import { AMMDepositFlags } from "xrpl";
import { getXumm } from "~/server/utils";

interface DepositParams {
  userToken: string
  account: string
  asset1: { currency: string; issuer?: string }
  asset2: { currency: string; issuer?: string }
  amount1?: string  // Amount of asset1 to deposit
  amount2?: string  // Amount of asset2 to deposit
  lpTokenOut?: string  // Desired LP tokens (for single-sided deposit)
  singleSided?: boolean
}

const depositAmm = async (params: DepositParams) => {
  const { userToken, account, asset1, asset2, amount1, amount2, lpTokenOut, singleSided } = params

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
      TransactionType: "AMMDeposit",
      Account: account,
      Asset,
      Asset2,
    }

    if (singleSided && amount1) {
      // Single-sided deposit - only depositing one asset
      // Use tfSingleAsset flag
      txjson.Flags = AMMDepositFlags.tfSingleAsset

      if (asset1.currency === 'XRP') {
        txjson.Amount = Math.floor(parseFloat(amount1) * 1000000).toString()
      } else {
        txjson.Amount = {
          currency: asset1.currency,
          issuer: asset1.issuer,
          value: amount1
        }
      }
    } else if (amount1 && amount2) {
      // Two-sided deposit - depositing both assets
      // Use tfTwoAsset flag for exact amounts
      txjson.Flags = AMMDepositFlags.tfTwoAsset

      if (asset1.currency === 'XRP') {
        txjson.Amount = Math.floor(parseFloat(amount1) * 1000000).toString()
      } else {
        txjson.Amount = {
          currency: asset1.currency,
          issuer: asset1.issuer,
          value: amount1
        }
      }

      if (asset2.currency === 'XRP') {
        txjson.Amount2 = Math.floor(parseFloat(amount2) * 1000000).toString()
      } else {
        txjson.Amount2 = {
          currency: asset2.currency,
          issuer: asset2.issuer,
          value: amount2
        }
      }
    } else if (lpTokenOut) {
      // LP Token-based deposit - specify how many LP tokens you want
      txjson.Flags = AMMDepositFlags.tfLPToken
      txjson.LPTokenOut = {
        currency: lpTokenOut,
        value: lpTokenOut
      }
    }

    console.log('[AMM Deposit Debug] Transaction:', JSON.stringify(txjson, null, 2))

    const payload = await xumm.payload?.create({
      user_token: userToken,
      txjson: txjson
    } as any, true);

    return payload;
  } catch (error: any) {
    console.error('[AMM Deposit Error]', error)
    throw createError({
      status: 500,
      statusMessage: 'Failed to create AMM deposit payload'
    })
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await depositAmm(body)
})
