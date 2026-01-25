import { PaymentFlags } from "xrpl";
import { getXumm } from "~/server/utils";

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

    // AMM constant product formula: output = (input * outputReserve) / (inputReserve + input)
    const estimatedOutput = (amountNum * toPoolSize) / (fromPoolSize + amountNum)

    // currencyFrom and currencyTo are now in raw format (either 3-char or 40-char hex)
    // as stored on the ledger, so we use them directly without conversion
    console.log('[AMM Swap Debug]', {
      currencyFrom,
      currencyTo,
      issuer,
      amount,
      fromPoolSize,
      toPoolSize,
      estimatedOutput,
    })

    // For tfPartialPayment: Amount is what we WANT, SendMax is what we're willing to SPEND
    // Set Amount high (we want as much as possible) and DeliverMin for slippage protection
    const txjson: any = {
      TransactionType: "Payment",
      Account: buyer,
      Destination: buyer,
      Flags: PaymentFlags.tfPartialPayment
    }

    if (currencyFrom === 'XRP') {
      // Paying XRP, receiving token
      txjson.Amount = {
        issuer: issuer,
        currency: currencyTo, // Already in correct format from ledger
        value: (estimatedOutput * 2).toFixed(6), // Ask for more than expected
      }
      txjson.SendMax = Math.floor(amountNum * 1000000).toString() // XRP in drops
      txjson.DeliverMin = {
        issuer: issuer,
        currency: currencyTo,
        value: (estimatedOutput * 0.5).toFixed(6), // 50% slippage for small pool testing
      }
    } else {
      // Paying token, receiving XRP
      txjson.Amount = Math.floor(estimatedOutput * 2 * 1000000).toString() // XRP in drops, ask for more
      txjson.SendMax = {
        issuer: issuer,
        currency: currencyFrom, // Already in correct format from ledger
        value: amount.toString(),
      }
      txjson.DeliverMin = Math.floor(estimatedOutput * 0.5 * 1000000).toString() // 50% slippage for small pool testing
    }

    console.log('[AMM Swap Debug] Transaction:', JSON.stringify(txjson, null, 2))

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