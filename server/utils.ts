import { Wallet, Client } from 'xrpl';

export function getWallet() {
    const wallet = Wallet.fromSeed(process.env.XRPL_COMMONS_SECRET || '');
    return wallet
}

export async function getExplorerClient() {
    const client = new Client(process.env.WSS_EXPLORER || '');
    await client.connect();
    return client;
}

export function convertPaddedHexToString(hex: string): string {
    // Strip trailing zeros that were added as padding
    hex = hex.replace(/0+$/, '');

    // Convert each pair of hexadecimal digits to a character
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      // Ensure valid character codes (avoid NUL and non-printable characters)
      if (code > 31 && code < 127) {
        str += String.fromCharCode(code);
      }
    }

    return str;
  }

  export function convertStringToHexPadded(str: string): string {
    // Convert string to hexadecimal
    let hex: string = '';
    for (let i = 0; i < str.length; i++) {
      const hexChar: string = str.charCodeAt(i).toString(16).padStart(2, '0');
      hex += hexChar;
    }

    // Pad with zeros to ensure it's 40 characters long
    const paddedHex: string = hex.padEnd(40, '0');
    return paddedHex.toUpperCase();
}