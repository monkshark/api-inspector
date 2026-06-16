import { describe, expect, it } from 'vitest'
import {
  base64ToBytes,
  bytesToText,
  decodeBase64,
  decodeBase64Url,
  decodeHex,
  hexToBytes,
  normalizeBase64Url,
} from '../src/core/decode/decoders'
import {
  printableRatio,
  readabilityScore,
  shannonEntropy,
} from '../src/core/decode/readability'
import { expiryStatus, readClaims } from '../src/core/decode/claims'

describe('base64', () => {
  it('decodes padded ascii', () => {
    expect(decodeBase64('aGVsbG8gd29ybGQ=')).toBe('hello world')
  })

  it('decodes unpadded ascii', () => {
    expect(decodeBase64('aGVsbG8')).toBe('hello')
  })

  it('decodes utf-8 multibyte', () => {
    expect(decodeBase64('7JWI64WV')).toBe('안녕')
  })

  it('round trips bytes', () => {
    const bytes = base64ToBytes('QUJD')
    expect(Array.from(bytes)).toEqual([65, 66, 67])
    expect(bytesToText(bytes)).toBe('ABC')
  })
})

describe('base64url', () => {
  it('normalizes url-safe chars to standard base64', () => {
    expect(normalizeBase64Url('a-b_c')).toBe('a+b/c')
  })

  it('decodes url-safe payload', () => {
    expect(decodeBase64Url('eyJhIjoxfQ')).toBe('{"a":1}')
  })

  it.each([
    ['', ''],
    ['ab', 'ab=='],
    ['abc', 'abc='],
    ['abcd', 'abcd'],
  ])('pads %s correctly', (input, expected) => {
    expect(normalizeBase64Url(input)).toBe(expected)
  })
})

describe('hex', () => {
  it('decodes hex to ascii', () => {
    expect(decodeHex('68656c6c6f')).toBe('hello')
  })

  it('converts hex to bytes', () => {
    expect(Array.from(hexToBytes('deadbeef'))).toEqual([222, 173, 190, 239])
  })

  it('uppercase hex decodes the same', () => {
    expect(decodeHex('48454C4C4F')).toBe('HELLO')
  })
})

describe('readability', () => {
  it('scores plain text as fully printable', () => {
    expect(printableRatio('hello world')).toBe(1)
  })

  it('scores control-char noise as zero', () => {
    expect(printableRatio('\x00\x01\x02')).toBe(0)
  })

  it('treats replacement chars as non-printable', () => {
    expect(printableRatio(String.fromCharCode(0xfffd, 0xfffd))).toBe(0)
  })

  it('counts non-ascii letters as printable', () => {
    expect(printableRatio('안녕')).toBe(1)
  })

  it('empty string scores zero', () => {
    expect(printableRatio('')).toBe(0)
    expect(shannonEntropy('')).toBe(0)
  })

  it('entropy of a single repeated char is zero', () => {
    expect(shannonEntropy('aaaa')).toBe(0)
  })

  it('entropy rises with variety', () => {
    expect(shannonEntropy('abcd')).toBeGreaterThan(shannonEntropy('aabb'))
  })

  it('readabilityScore mirrors printableRatio', () => {
    expect(readabilityScore('hello')).toBe(printableRatio('hello'))
  })
})

describe('claims', () => {
  it('extracts registered claims', () => {
    const claims = readClaims({
      iss: 'glyph',
      sub: '123',
      exp: 1700000000,
      extra: 'ignored',
    })
    expect(claims.iss).toBe('glyph')
    expect(claims.sub).toBe('123')
    expect(claims.exp).toBe(1700000000)
  })

  it('accepts array aud', () => {
    expect(readClaims({ aud: ['a', 'b'] }).aud).toEqual(['a', 'b'])
  })

  it('returns empty object on wrong types', () => {
    expect(readClaims({ exp: 'soon' })).toEqual({})
  })

  it('returns empty object on non-object', () => {
    expect(readClaims('nope')).toEqual({})
    expect(readClaims(null)).toEqual({})
  })

  it('flags expired tokens', () => {
    const status = expiryStatus(1000, 2000 * 1000)
    expect(status.expired).toBe(true)
    expect(status.remainingMs).toBeLessThan(0)
  })

  it('flags valid tokens with remaining time', () => {
    const status = expiryStatus(2000, 1000 * 1000)
    expect(status.expired).toBe(false)
    expect(status.remainingMs).toBe(1000 * 1000)
  })
})
