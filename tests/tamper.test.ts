import { describe, expect, it } from 'vitest'
import {
  ruleMatches,
  pickRule,
  deepMerge,
  applyTamper,
  escapeForRegExp,
  type TamperRule,
} from '../src/core/tamper'

function rule(over: Partial<TamperRule> = {}): TamperRule {
  return {
    id: 'r1',
    enabled: true,
    urlPattern: 'example\\.com',
    methods: [],
    statusOverride: null,
    bodyMode: 'replace',
    body: '',
    ...over,
  }
}

describe('ruleMatches', () => {
  it('ignores disabled rules', () => {
    expect(ruleMatches(rule({ enabled: false }), 'https://example.com', 'GET')).toBe(false)
  })

  it('matches by url regex', () => {
    expect(ruleMatches(rule(), 'https://example.com/a', 'GET')).toBe(true)
    expect(ruleMatches(rule(), 'https://other.org/a', 'GET')).toBe(false)
  })

  it('filters by method when methods are set', () => {
    const r = rule({ methods: ['POST'] })
    expect(ruleMatches(r, 'https://example.com', 'post')).toBe(true)
    expect(ruleMatches(r, 'https://example.com', 'GET')).toBe(false)
  })

  it('matches any method when methods is empty', () => {
    expect(ruleMatches(rule(), 'https://example.com', 'DELETE')).toBe(true)
  })

  it('returns false for an invalid regex', () => {
    expect(ruleMatches(rule({ urlPattern: '(' }), 'https://example.com', 'GET')).toBe(false)
  })
})

describe('pickRule', () => {
  it('returns the first matching enabled rule', () => {
    const a = rule({ id: 'a', urlPattern: 'never' })
    const b = rule({ id: 'b', urlPattern: 'example' })
    const c = rule({ id: 'c', urlPattern: 'com' })
    expect(pickRule([a, b, c], 'https://example.com', 'GET')?.id).toBe('b')
  })

  it('returns null when nothing matches', () => {
    expect(pickRule([rule({ urlPattern: 'never' })], 'https://example.com', 'GET')).toBeNull()
  })
})

describe('deepMerge', () => {
  it('merges nested objects', () => {
    expect(deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } })).toEqual({
      a: 1,
      b: { c: 2, d: 3 },
    })
  })

  it('replaces arrays and primitives', () => {
    expect(deepMerge({ a: [1, 2] }, { a: [9] })).toEqual({ a: [9] })
    expect(deepMerge(1, 2)).toBe(2)
  })
})

describe('applyTamper', () => {
  it('replaces the whole body in replace mode', () => {
    expect(applyTamper(rule({ bodyMode: 'replace', body: '{"x":1}' }), '{"y":2}')).toBe(
      '{"x":1}',
    )
  })

  it('merges JSON in merge mode', () => {
    const out = applyTamper(
      rule({ bodyMode: 'merge', body: '{"role":"admin"}' }),
      '{"role":"user","id":7}',
    )
    expect(JSON.parse(out)).toEqual({ role: 'admin', id: 7 })
  })

  it('falls back to the patch when merge target is not JSON', () => {
    expect(applyTamper(rule({ bodyMode: 'merge', body: '{"a":1}' }), 'not json')).toBe(
      '{"a":1}',
    )
  })
})

describe('escapeForRegExp', () => {
  it('escapes regex metacharacters', () => {
    const escaped = escapeForRegExp('https://x.com/a?b=1')
    expect(new RegExp(escaped).test('https://x.com/a?b=1')).toBe(true)
    expect(new RegExp(escaped).test('https://xxcom/a?b=1')).toBe(false)
  })
})
