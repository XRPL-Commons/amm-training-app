import { PaymentFlags } from "xrpl";
import { convertStringToHexPadded, getXumm } from "~/server/utils";

const tradeAmm = async ({ userToken, buyer, currencyFrom, currencyFromPoolSize, currencyTo, currencyToPoolSize, issuer, amount }:
    { userToken: string, buyer: string, currencyFrom: string, currencyFromPoolSize: string, currencyTo: string, currencyToPoolSize: string, issuer: string, amount: string }) => {

  if (!userToken) {
    throw createError({
      status: 400,
      statusMessage: 'missing user token'
    })
  }

  try {
    const xumm = getXumm();
    await xumm?.ping();
    const amountNum = parseFloat(amount)
    const fromPoolSize = parseFloat(currencyFromPoolSize)
    const toPoolSize = parseFloat(currencyToPoolSize)

    const txjson = {
      TransactionType: "Payment",
      Account: buyer,
      Destination: buyer,
      Amount: currencyFrom === 'XRP' ?
      {
        issuer: issuer,
        currency: convertStringToHexPadded(currencyTo),
        // Estimate output using AMM formula, will be adjusted by tfPartialPayment
        value: Math.floor(amountNum * (toPoolSize / fromPoolSize)).toString(),
      } : Math.floor((amountNum / (fromPoolSize / toPoolSize)) * 1000000).toString(),
      SendMax: currencyFrom === 'XRP' ?
      Math.floor(amountNum * 1000000).toString() : {
            issuer: issuer,
            currency: convertStringToHexPadded(currencyFrom),
            value: amount.toString(),
      },
      Flags: PaymentFlags.tfPartialPayment
    }
    const payload = await xumm.payload?.create({
      user_token: userToken,
      txjson: txjson
    } as any, true);

    return payload;
  } catch (error: any) {
    throw createError({
      status: 500,
      statusMessage: 'Failed to create AMM trade payload'
    })
  }
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    return await tradeAmm({
        userToken: body.userToken,
        buyer: body.buyer,
        currencyFrom: body.currencyFrom,
        currencyFromPoolSize: body.currencyFromPoolSize,
        currencyTo: body.currencyTo,
        currencyToPoolSize: body.currencyToPoolSize,
        issuer: body.issuer,
        amount: body.amount
    })
})