import type { NFTokenMint } from 'xrpl';
import { convertStringToHex, NFTokenMintFlags } from 'xrpl';
import type { NFTokenMintMetadata } from 'xrpl/dist/npm/models/transactions/NFTokenMint';

import { getWallet, getExplorerClient } from '../utils';

export async function mintNft(uri: string): Promise<{ nftId: string; mintedAt: string}> {
    const wallet = getWallet();
    const client = await getExplorerClient();    

    const nftMintTx: NFTokenMint = {
        TransactionType: "NFTokenMint",
        Account: wallet.address,
        URI: convertStringToHex(uri),
        Flags: NFTokenMintFlags.tfBurnable + NFTokenMintFlags.tfTransferable, // Burnable in case no one is buying it
        NFTokenTaxon: 0, // Unique identifier for the NFT type
    };

    const prepared = await client.autofill(nftMintTx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    return {
        nftId: (result.result.meta as NFTokenMintMetadata)?.nftoken_id as string,
        mintedAt: new Date().toISOString()
    };
}
