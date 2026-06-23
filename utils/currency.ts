export function decodeCurrency(currency: string): string {
  if (!currency) return ''
  if (currency.length <= 4) return currency
  if (currency.length === 40 && currency.startsWith('03')) return 'LP'
  
  // Decode hex currency
  // Strip trailing zeros that were added as padding
  let hex = currency.replace(/0+$/, '')
  
  let str = ''
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16)
    if (code > 31 && code < 127) str += String.fromCharCode(code)
  }
  return str.replace(/\0/g, '').trim() || currency.slice(0, 6)
}

export function encodeCurrency(str: string): string {
  if (str.length <= 3) return str // Regular currency code
  
  // Convert string to hexadecimal
  let hex: string = ''
  for (let i = 0; i < str.length; i++) {
    const hexChar: string = str.charCodeAt(i).toString(16).padStart(2, '0')
    hex += hexChar
  }

  // Pad with zeros to ensure it's 40 characters long
  const paddedHex: string = hex.padEnd(40, '0')
  return paddedHex.toUpperCase()
}
