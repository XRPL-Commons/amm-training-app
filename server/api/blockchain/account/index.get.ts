import type { AccountInfoRequest, AccountLinesResponse } from 'xrpl'
import { getExplorerClient } from '~/server/utils';

const getAccountInfo = async ({ xrplAddress }: { xrplAddress: string }) => {
  const client = await getExplorerClient();
  try {
    const accountInfoRequest: AccountInfoRequest = {
        command: 'account_info',
        account: xrplAddress
    };    
    // console.log(accountInfoRequest)
    const accountInfoResponse: AccountLinesResponse = await client.request(accountInfoRequest);    

    return accountInfoResponse;
  } catch(e) {
    console.log(e)
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch account info'
    })
  } finally {
    await client.disconnect();
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { xrplAddress }: { xrplAddress: any } = getQuery(event)
    return await getAccountInfo({ xrplAddress })    
  } catch (e) {
    console.error(e)
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch info'
    })
  }
})
