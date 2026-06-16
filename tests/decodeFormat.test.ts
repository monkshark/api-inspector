import { describe, expect, it } from 'vitest'
import { relativeTime, isJson, uuidVariant } from '../src/core/decode/format'

const NOW = 1_700_000_000_000

describe('relativeTime', () => {
  it('formats future times', () => {
    expect(relativeTime(NOW + 3 * 86400000, NOW)).toBe('in 3 days')
  })

  it('formats past times', () => {
    expect(relativeTime(NOW - 2 * 3600000, NOW)).toBe('2 hours ago')
  })

  it('uses singular units', () => {
    expect(relativeTime(NOW + 86400000, NOW)).toBe('in 1 day')
    expect(relativeTime(NOW - 60000, NOW)).toBe('1 minute ago')
  })

  it('falls back below one second', () => {
    expect(relativeTime(NOW + 500, NOW)).toBe('in a moment')
    expect(relativeTime(NOW - 500, NOW)).toBe('just now')
  })

  it('scales to years', () => {
    expect(relativeTime(NOW + 2 * 31536000000, NOW)).toBe('in 2 years')
  })
})

describe('isJson', () => {
  it('accepts objects and arrays', () => {
    expect(isJson('{"a":1}')).toBe(true)
    expect(isJson('[1,2,3]')).toBe(true)
  })

  it('rejects scalars and garbage', () => {
    expect(isJson('42')).toBe(false)
    expect(isJson('hello')).toBe(false)
    expect(isJson('"a string"')).toBe(false)
  })
})

describe('uuidVariant', () => {
  it.each([
    ['550e8400-e29b-41d4-a716-446655440000', 'RFC 4122'],
    ['550e8400-e29b-41d4-c716-446655440000', 'Microsoft'],
    ['550e8400-e29b-41d4-0716-446655440000', 'NCS (legacy)'],
    ['550e8400-e29b-41d4-e716-446655440000', 'Reserved'],
  ])('classifies %s', (value, variant) => {
    expect(uuidVariant(value)).toBe(variant)
  })
})
