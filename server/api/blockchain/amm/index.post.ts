import { OfferCreateFlags, PaymentFlags } from "xrpl";
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
    
    let xumm = getXumm();

    await xumm?.ping();    

    // const txjson = {
    //   TransactionType: "Payment",
    //   Account: buyer,
    //   Destination: buyer,
    //   Amount: currencyFrom === 'XRP' ? (parseInt(amount) * 1000000).toString() : {
    //       issuer: issuer,
    //       currency: convertStringToHexPadded(currencyFrom),
    //       value: amount.toString(),
    //   },
    //   SendMax: currencyFrom === 'XRP' ? {
    //         issuer: issuer,
    //         currency: convertStringToHexPadded(currencyTo),
    //         value:
    //         parseInt(((parseInt(amount) * (parseInt(currencyToPoolSize) / parseInt(currencyFromPoolSize))) * 0.8).toString()),
    //   }:
    //   parseInt(((Math.floor(((parseInt(amount) / (parseInt(currencyFromPoolSize) / parseInt(currencyToPoolSize))) * 0.8) * 1000000) / 10000) * 10000).toFixed(0)).toString(),
    //   Flags: PaymentFlags.tfPartialPayment
    // }
    const txjson = {
      TransactionType: "Payment",
      Account: buyer,
      Destination: buyer,
      Amount: currencyFrom === 'XRP' ? 
      {
        issuer: issuer,
        currency: convertStringToHexPadded(currencyTo),
        value: parseInt(((parseInt(amount) * (parseInt(currencyToPoolSize) / parseInt(currencyFromPoolSize)))).toString()),
      } : parseInt(((Math.floor(((parseInt(amount) / (parseInt(currencyFromPoolSize) / parseInt(currencyToPoolSize)))) * 1000000) / 10000) * 10000).toFixed(0)).toString(),
      SendMax: currencyFrom === 'XRP' ? 
      (parseInt(amount) * 1000000).toString() : {
            issuer: issuer,
            currency: convertStringToHexPadded(currencyFrom),
            value:
            amount.toString(),
      },
      Flags: PaymentFlags.tfPartialPayment
    }
    console.log(txjson);
    const payload = await xumm.payload?.create({
      user_token: userToken, // Doc: https://docs.xumm.dev/concepts/payloads-sign-requests/delivery/push
      txjson: txjson
    } as any, true);

    // console.log(payload)

    return payload;
  } catch (error: any) {
    console.error(error);
    throw createError({
      status: 500,
      statusMessage: error.toString()
    })
  }
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    console.log('tradeAmm', body)
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

function convertSideToBoolean(side: string): boolean {
    const lowercasedSide = side.toLowerCase();
  
    if (lowercasedSide === "buy") {
      return true;
    } else if (lowercasedSide === "sell") {
      return false;
    } else {
      throw new Error("Invalid side value");
    }
}