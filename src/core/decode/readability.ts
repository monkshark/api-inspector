function isPrintable(code: number): boolean {
  if (code === 9 || code === 10 || code === 13) return true
  if (code >= 32 && code <= 126) return true
  if (code === 0xfffd) return false
  if (code >= 0xa0) return true
  return false
}

export function printableRatio(text: string): number {
  const chars = [...text]
  if (chars.length === 0) return 0
  let printable = 0
  for (const ch of chars) {
    if (isPrintable(ch.codePointAt(0)!)) printable++
  }
  return printable / chars.length
}

export function shannonEntropy(text: string): number {
  const chars = [...text]
  if (chars.length === 0) return 0
  const freq = new Map<string, number>()
  for (const ch of chars) freq.set(ch, (freq.get(ch) ?? 0) + 1)
  let entropy = 0
  for (const count of freq.values()) {
    const p = count / chars.length
    entropy -= p * Math.log2(p)
  }
  return entropy
}

export function readabilityScore(text: string): number {
  return printableRatio(text)
}
