import { getExplorerClient } from '~/server/utils';

const getPubKey = async ({ xrplAddress }: { xrplAddress: string }) => {
  const client = await getExplorerClient();
  try {
    const response = await client.request({
      command: 'account_tx',
      account: xrplAddress,
      limit: 1,
    });

    const transactions = response.result.transactions || [];

    // Find a transaction where Account matches the requested address
    const match = transactions.find(
      (entry: any) => (entry.tx as any)?.Account === xrplAddress
    );

    if (!match) {
      throw createError({
        status: 404,
        statusMessage: 'No signed transaction found for this account',
      });
    }

    const signingPubKey = (match.tx as any)?.SigningPubKey;
    if (!signingPubKey) {
      throw createError({
        status: 404,
        statusMessage: 'No SigningPubKey found in transaction',
      });
    }

    return { pubkey: signingPubKey };
  } catch (e: any) {
    if (e.statusCode) throw e;
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch public key',
    });
  } finally {
    await client.disconnect();
  }
};

export default defineEventHandler(async (event) => {
  try {
    const { xrplAddress }: { xrplAddress: any } = getQuery(event);
    if (!xrplAddress) {
      throw createError({
        status: 400,
        statusMessage: 'xrplAddress is required',
      });
    }
    return await getPubKey({ xrplAddress });
  } catch (e: any) {
    if (e.statusCode) throw e;
    throw createError({
      status: 500,
      statusMessage: 'Unable to fetch public key',
    });
  }
});
