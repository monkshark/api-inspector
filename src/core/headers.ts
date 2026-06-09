export interface HarHeader {
  name: string
  value: string
}

export function headersToRecord(headers: HarHeader[] | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!headers) return out
  for (const h of headers) {
    if (!h || typeof h.name !== 'string') continue
    out[h.name] = h.name in out ? `${out[h.name]}, ${h.value}` : h.value
  }
  return out
}

export function getHeader(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const lower = name.toLowerCase()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key]
  }
  return undefined
}
