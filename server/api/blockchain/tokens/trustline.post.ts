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

    const payload = await xumm.payload?.create({
      user_token: userToken,
      txjson: {
        TransactionType: "TrustSet",
        Account: account,
        LimitAmount: {
            issuer: issuer,
            currency: convertStringToHexPadded(currency),
            value: limit || "1000000000000000",
        },
      }
    } as any, true);
    return payload;
  } catch (error: any) {
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