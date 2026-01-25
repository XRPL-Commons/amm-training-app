import { convertStringToHexPadded, getXumm } from "~/server/utils";

const createTrustline = async ({ userToken, account, currency, issuer, limit }:
    { userToken: string, account: string, currency: string, issuer: string, limit?: string }) => {

  if (!userToken) {
    throw createError({
      status: 400,
      statusMessage: 'missing user token'
    })
  }

  try {
    let xumm = getXumm();

    await xumm?.ping()

    // If currency is already in raw format (3-char or 40-char hex), use it directly
    // Otherwise convert to hex
    const currencyForTx = (currency.length === 3 || currency.length === 40)
      ? currency
      : convertStringToHexPadded(currency);

    console.log('[Trustline Debug]', { currency, currencyForTx, issuer, account, limit })

    const payload = await xumm.payload?.create({
      user_token: userToken,
      txjson: {
        TransactionType: "TrustSet",
        Account: account,
        LimitAmount: {
            issuer: issuer,
            currency: currencyForTx,
            value: limit || "1000000000000000",
        },
      }
    } as any, true);
    return payload;
  } catch (error: any) {
    console.error('[Trustline Error]', error)
    throw createError({
      status: 500,
      statusMessage: 'Failed to create trustline payload'
    })
  }
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    return await createTrustline({
        userToken: body.userToken,
        account: body.account,
        currency: body.currency,
        issuer: body.issuer,
        limit: body.limit,
    })
})