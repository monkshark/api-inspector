import { describe, it, expect } from 'vitest'
import { statusPhrase, statusLabel } from '../src/core/status'

describe('statusPhrase', () => {
  it('returns standard reason phrases', () => {
    expect(statusPhrase(200)).toBe('OK')
    expect(statusPhrase(404)).toBe('Not Found')
    expect(statusPhrase(500)).toBe('Internal Server Error')
    expect(statusPhrase(418)).toBe("I'm a Teapot")
  })
  it('uses fallback for unknown codes', () => {
    expect(statusPhrase(299, 'Custom')).toBe('Custom')
    expect(statusPhrase(299)).toBe('')
  })
  it('maps pending for status 0', () => {
    expect(statusPhrase(0)).toBe('pending')
  })
})

describe('statusLabel', () => {
  it('combines code and phrase', () => {
    expect(statusLabel(200)).toBe('200 OK')
    expect(statusLabel(403)).toBe('403 Forbidden')
  })
  it('falls back to HTTP/2 empty reason via the table', () => {
    expect(statusLabel(204, '')).toBe('204 No Content')
  })
  it('shows just the code when no phrase is known', () => {
    expect(statusLabel(299, '')).toBe('299')
  })
  it('shows pending for 0', () => {
    expect(statusLabel(0)).toBe('pending')
  })
})
