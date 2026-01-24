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
    
    // console.log(`NFT Mint transaction result: ${JSON.stringify(result, null, 2)}`);

    return {
        nftId: (result.result.meta as NFTokenMintMetadata)?.nftoken_id as string,
        mintedAt: new Date().toISOString()
    };
}

// export async function createOffer(buyer: currency: string, issuer: string, amount: string): Promise<string> {
//     console.log(currency)
//     console.log(amount)
//     const wallet = getWallet();    
//     const client = await getExplorerClient();

//     const createOfferTx: OfferCreate = {
//         TransactionType: "OfferCreate",
//         Account: wallet.address,
//         TakerGets: "",
//         TakerPays: {

//         }
//         Flags: OfferCreateFlags.tfImmediateOrCancel
//     };

//     const prepared = await client.autofill(nftCreateOfferTx);
//     const signed = wallet.sign(prepared);
//     const result = await client.submitAndWait(signed.tx_blob);

//     await client.disconnect();
    
//     // console.log(`NFT Create transaction result: ${JSON.stringify(result, null, 2)}`);
//     const offerId = (result.result.meta as NFTokenCreateOfferMetadata)?.offer_id as string;
//     return offerId;
// }
