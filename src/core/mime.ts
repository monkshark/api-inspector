import type { ResBodyEntry } from '../types'

export const MAX_BODY_BYTES = 2_000_000

export function isTextMime(mime: string | undefined): boolean {
  if (!mime) return true
  return (
    mime.includes('json') ||
    mime.includes('text') ||
    mime.includes('xml') ||
    mime.includes('javascript') ||
    mime.includes('html') ||
    mime.includes('csv')
  )
}

export function decodeContent(
  content: string | null,
  encoding: string | undefined,
  mime: string | undefined,
  maxBytes = MAX_BODY_BYTES,
): ResBodyEntry {
  if (content == null) return { state: 'loaded', body: '', mime }
  if (content.length > maxBytes) {
    return { state: 'truncated', body: content.slice(0, maxBytes), mime }
  }
  if (encoding === 'base64') {
    if (!isTextMime(mime)) return { state: 'binary', mime }
    try {
      return { state: 'loaded', body: atob(content), mime }
    } catch {
      return { state: 'error', mime }
    }
  }
  return { state: 'loaded', body: content, mime }
}
