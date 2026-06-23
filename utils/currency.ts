export function decodeCurrency(currency: string): string {
  if (!currency) return ''
  if (currency.length <= 4) return currency
  if (currency.length === 40 && currency.startsWith('03')) return 'LP'
  
  // Decode hex currency
  let str = ''
  for (let i = 0; i < currency.length; i += 2) {
    const hexByte = currency.substr(i, 2)
    if (hexByte === '00') continue // Skip padding null bytes
    const code = parseInt(hexByte, 16)
    if (code > 31 && code < 127) str += String.fromCharCode(code)
  }
  return str.trim() || currency.slice(0, 6)
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
