import { Wallet, Client } from 'xrpl';



export async function getExplorerClient() {
    const client = new Client(process.env.WSS_EXPLORER || '');
    await client.connect();
    return client;
}
