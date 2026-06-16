const UNITS: Array<[number, string]> = [
  [31536000000, 'year'],
  [2592000000, 'month'],
  [86400000, 'day'],
  [3600000, 'hour'],
  [60000, 'minute'],
  [1000, 'second'],
]

export function relativeTime(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs
  const future = diff >= 0
  const abs = Math.abs(diff)
  for (const [ms, name] of UNITS) {
    if (abs >= ms) {
      const value = Math.floor(abs / ms)
      const unit = value === 1 ? name : `${name}s`
      return future ? `in ${value} ${unit}` : `${value} ${unit} ago`
    }
  }
  return future ? 'in a moment' : 'just now'
}

export function isJson(text: string): boolean {
  try {
    const value = JSON.parse(text)
    return value !== null && typeof value === 'object'
  } catch {
    return false
  }
}

export function uuidVariant(value: string): string {
  const nibble = parseInt(value[19], 16)
  if (Number.isNaN(nibble)) return '—'
  if (nibble >= 0x8 && nibble <= 0xb) return 'RFC 4122'
  if (nibble >= 0xc && nibble <= 0xd) return 'Microsoft'
  if (nibble <= 0x7) return 'NCS (legacy)'
  return 'Reserved'
}
