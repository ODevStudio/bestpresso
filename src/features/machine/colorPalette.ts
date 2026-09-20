export const color16 = (hex: string) => hex.slice(1).match(/../g)!.map(channel => channel + channel).join('').toUpperCase()
export const color8 = (hex: string) => `#${[0, 4, 8].map(index => Math.round(parseInt(hex.slice(index, index + 4), 16) / 257).toString(16).padStart(2, '0')).join('')}`
