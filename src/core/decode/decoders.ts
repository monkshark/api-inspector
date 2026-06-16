export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes)
}

export function normalizeBase64Url(input: string): string {
  let s = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad === 2) s += '=='
  else if (pad === 3) s += '='
  return s
}

export function decodeBase64(input: string): string {
  return bytesToText(base64ToBytes(input))
}

export function decodeBase64Url(input: string): string {
  return bytesToText(base64ToBytes(normalizeBase64Url(input)))
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export function decodeHex(hex: string): string {
  return bytesToText(hexToBytes(hex))
}
