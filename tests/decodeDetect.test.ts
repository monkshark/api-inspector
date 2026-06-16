import { describe, expect, it } from 'vitest'
import { detect } from '../src/core/decode/detect'
import type { Candidate, Format } from '../src/core/decode/types'

function top(input: string): Candidate | undefined {
  return detect(input)[0]
}

function formats(input: string): Format[] {
  return detect(input).map((candidate) => candidate.format)
}

function b64urlRaw(text: string): string {
  return btoa(text)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function makeJwt(header: object, payloadText: string, signature = 'sig'): string {
  return `${b64urlRaw(JSON.stringify(header))}.${b64urlRaw(payloadText)}.${signature}`
}

const VALID_JWT = makeJwt(
  { alg: 'HS256', typ: 'JWT' },
  JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: 1516239022 }),
)

describe('jwt detection', () => {
  it('detects a valid token', () => {
    const result = top(VALID_JWT)
    expect(result?.format).toBe('jwt')
    expect(result?.jwt?.payload?.name).toBe('John Doe')
    expect(result?.jwt?.payloadValid).toBe(true)
  })

  it('exposes header alg', () => {
    expect(top(VALID_JWT)?.jwt?.header?.alg).toBe('HS256')
  })

  it('keeps the signature segment', () => {
    expect(top(VALID_JWT)?.jwt?.signature).toBe('sig')
  })

  it('flags a non-JSON payload as jwt-invalid', () => {
    const token = makeJwt({ alg: 'none', typ: 'JWT' }, 'not json at all')
    const result = top(token)
    expect(result?.format).toBe('jwt-invalid')
    expect(result?.jwt?.payloadValid).toBe(false)
    expect(result?.error).toContain('payload')
  })

  it('flags a truncated payload as jwt-invalid', () => {
    const token = makeJwt({ alg: 'HS256', typ: 'JWT' }, '{"sub":"abc"')
    expect(top(token)?.format).toBe('jwt-invalid')
  })

  it('handles an empty signature segment', () => {
    const token = `${b64urlRaw(JSON.stringify({ alg: 'none' }))}.${b64urlRaw('{"a":1}')}.`
    const result = top(token)
    expect(result?.format).toBe('jwt')
    expect(result?.jwt?.signature).toBe('')
  })

  it('rejects when the header is not JSON', () => {
    const token = `${b64urlRaw('not-json')}.${b64urlRaw('{"a":1}')}.sig`
    expect(formats(token)).not.toContain('jwt')
  })

  it('rejects two-segment strings', () => {
    expect(formats('aaa.bbb')).not.toContain('jwt')
  })
})

describe('uuid detection', () => {
  it.each([
    ['550e8400-e29b-41d4-a716-446655440000', 4],
    ['c232ab00-9414-11ec-b3c8-9e6bdeced846', 1],
    ['000003e8-cbb9-21ea-b201-00045a86c8a1', 2],
    ['9125a8dc-52ee-365b-a5aa-81b0b3681cf6', 3],
    ['90123e1c-7512-523e-bb28-76fab9f2f73d', 5],
  ])('detects %s as v%i', (input, version) => {
    const result = top(input)
    expect(result?.format).toBe('uuid')
    expect(result?.uuidVersion).toBe(version)
  })

  it('is case insensitive and normalizes to lowercase', () => {
    const result = top('550E8400-E29B-41D4-A716-446655440000')
    expect(result?.format).toBe('uuid')
    expect(result?.output).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('rejects a uuid missing a group', () => {
    expect(formats('550e8400-e29b-41d4-a716')).not.toContain('uuid')
  })
})

describe('url detection', () => {
  it('decodes percent-encoded text', () => {
    const result = top('hello%20world%21')
    expect(result?.format).toBe('url')
    expect(result?.output).toBe('hello world!')
  })

  it('decodes encoded query strings', () => {
    expect(top('a%3D1%26b%3D2')?.output).toBe('a=1&b=2')
  })

  it('ignores text without percent escapes', () => {
    expect(formats('plain text')).not.toContain('url')
  })

  it('reports an error on malformed percent escapes', () => {
    const result = detect('%E0%A4%A').find((c) => c.format === 'url')
    expect(result?.error).toBeTruthy()
  })
})

describe('timestamp detection', () => {
  it('detects 10-digit seconds in range', () => {
    const result = top('1718511600')
    expect(result?.format).toBe('unix-seconds')
    expect(result?.epochMs).toBe(1718511600000)
    expect(result?.output).toBe(new Date(1718511600000).toISOString())
  })

  it('detects 13-digit millis in range', () => {
    expect(top('1718511600000')?.format).toBe('unix-millis')
  })

  it('rejects out-of-range 10-digit numbers', () => {
    expect(formats('5000000000')).not.toContain('unix-seconds')
  })

  it('rejects sub-2000 timestamps', () => {
    expect(formats('0000000001')).not.toContain('unix-seconds')
  })

  it('rejects 11 and 12 digit numbers', () => {
    expect(formats('12345678901')).not.toContain('unix-seconds')
    expect(formats('12345678901')).not.toContain('unix-millis')
  })

  it('outranks hex for an in-range numeric string', () => {
    expect(top('1718511600')?.format).toBe('unix-seconds')
  })

  it.each([
    ['946684800', false],
    ['9999999999', false],
    ['1000000000', true],
    ['1600000000', true],
  ])('range filter for %s -> %s', (input, expected) => {
    expect(formats(input).includes('unix-seconds')).toBe(expected)
  })
})

describe('hex vs base64 conflict', () => {
  it('prefers hex when the hex decode is readable', () => {
    expect(top('68656c6c6f')?.format).toBe('hex')
  })

  it('prefers base64 when only base64 is readable', () => {
    expect(top('aGVsbG8gd29ybGQ=')?.format).toBe('base64')
  })

  it('lists both candidates for the ambiguous "beef"', () => {
    const result = formats('beef')
    expect(result).toContain('hex')
    expect(result).toContain('base64')
    expect(result[0]).toBe('hex')
  })

  it('keeps confidence low for unreadable ambiguous input', () => {
    expect(top('beef')!.confidence).toBeLessThan(0.6)
  })

  it('gives readable hex high confidence', () => {
    expect(top('68656c6c6f')!.confidence).toBeGreaterThan(0.8)
  })
})

describe('base64 / base64url detection', () => {
  it('detects standard base64 with padding', () => {
    expect(top('U29tZSB0ZXh0')?.format).toBe('base64')
  })

  it('detects base64url when it contains url-safe chars', () => {
    const value = 'aaaa-bbbb_cccc'
    expect(formats(value)).toContain('base64url')
  })

  it('does not double-count plain alnum as base64url', () => {
    expect(formats('U29tZSB0ZXh0')).not.toContain('base64url')
  })

  it('rejects base64 of invalid length', () => {
    expect(formats('abcde')).not.toContain('base64')
  })

  it('rejects strings with spaces', () => {
    expect(detect('not base64 here')).toEqual([])
  })
})

describe('detect contract', () => {
  it('returns an empty array for blank input', () => {
    expect(detect('')).toEqual([])
    expect(detect('   ')).toEqual([])
  })

  it('trims surrounding whitespace before detecting', () => {
    expect(top('  68656c6c6f  ')?.format).toBe('hex')
  })

  it('sorts candidates by descending confidence', () => {
    const list = detect('beef')
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].confidence).toBeGreaterThanOrEqual(list[i].confidence)
    }
  })

  it('returns a preview for every candidate', () => {
    for (const candidate of detect('beef')) {
      expect(typeof candidate.preview).toBe('string')
    }
  })

  it('never returns confidence outside 0..1', () => {
    const inputs = [VALID_JWT, '68656c6c6f', 'beef', '1718511600', 'hello%20x']
    for (const input of inputs) {
      for (const candidate of detect(input)) {
        expect(candidate.confidence).toBeGreaterThan(0)
        expect(candidate.confidence).toBeLessThanOrEqual(1)
      }
    }
  })
})
