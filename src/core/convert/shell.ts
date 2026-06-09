export interface ConvertOptions {
  mask: boolean
  maskKeys: string[]
  windows?: boolean
}

export function singleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}
