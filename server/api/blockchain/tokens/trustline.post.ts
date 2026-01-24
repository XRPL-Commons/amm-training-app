import { OfferCreateFlags } from "xrpl";
import { convertStringToHexPadded, getXumm } from "~/server/utils";

const tradeAmm = async ({ userToken, account, currency, issuer }: 
    { userToken: string, account: string, currency: string, issuer: string }) => {

  if (!userToken) {
    throw createError({
      status: 400,
      statusMessage: 'missing user token'
    })
  }

  try {
    // let orderBuy = convertSideToBoolean(side);   
    
    let xumm = getXumm();  

    await xumm?.ping()    

    // Could try with Payment as well easier I think
    const payload = await xumm.payload?.create({
      user_token: userToken, // Doc: https://docs.xumm.dev/concepts/payloads-sign-requests/delivery/push
      txjson: {
        TransactionType: "TrustSet",
        Account: account,
        LimitAmount: {
            issuer: issuer,
            currency: convertStringToHexPadded(currency),
            value: "1000000000000000",
        },        
      }
    } as any, true);
    console.log(payload)
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
        account: body.account,         
        currency: body.currency, 
        issuer: body.issuer,         
    })
})