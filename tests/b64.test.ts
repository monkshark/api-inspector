import { describe, expect, it } from 'vitest'
import { encodeUtf8ToBase64, decodeBase64ToUtf8 } from '../src/core/b64'

describe('base64 utf-8 round trip', () => {
  it('round-trips ascii', () => {
    const s = '{"ok":true}'
    expect(decodeBase64ToUtf8(encodeUtf8ToBase64(s))).toBe(s)
  })

  it('round-trips unicode', () => {
    const s = '한글 + emoji 😀 + 中文'
    expect(decodeBase64ToUtf8(encodeUtf8ToBase64(s))).toBe(s)
  })

  it('produces valid base64', () => {
    expect(encodeUtf8ToBase64('AB')).toBe('QUI=')
  })
})
