import { describe, it, expect } from 'vitest'
import {
  applyFilter,
  makeUrlMatcher,
  isValidRegex,
  statusClass,
  EMPTY_FILTER,
} from '../src/core/filter'
import { makeRequest } from './fixtures'

describe('statusClass', () => {
  it('classifies by range', () => {
    expect(statusClass(200)).toBe('2xx')
    expect(statusClass(301)).toBe('3xx')
    expect(statusClass(404)).toBe('4xx')
    expect(statusClass(500)).toBe('5xx')
    expect(statusClass(0)).toBe('pending')
  })
})

describe('isValidRegex', () => {
  it('treats empty as valid', () => {
    expect(isValidRegex('')).toBe(true)
  })
  it('detects invalid patterns', () => {
    expect(isValidRegex('(')).toBe(false)
    expect(isValidRegex('users')).toBe(true)
  })
})

describe('makeUrlMatcher', () => {
  it('matches by regex', () => {
    const m = makeUrlMatcher('users')
    expect(m('https://a/users')).toBe(true)
    expect(m('https://a/posts')).toBe(false)
  })
  it('falls back to literal include on invalid regex', () => {
    const m = makeUrlMatcher('(')
    expect(m('https://a/(test')).toBe(true)
  })
})

describe('applyFilter', () => {
  const reqs = [
    makeRequest({ id: 'a', method: 'GET', status: 200, type: 'xhr', url: 'https://x/users' }),
    makeRequest({ id: 'b', method: 'POST', status: 404, type: 'fetch', url: 'https://x/login' }),
    makeRequest({ id: 'c', method: 'GET', status: 200, type: 'image', url: 'https://x/a.png' }),
  ]

  it('hides static assets by default', () => {
    const out = applyFilter(reqs, EMPTY_FILTER)
    expect(out.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('filters by method', () => {
    const out = applyFilter(reqs, { ...EMPTY_FILTER, methods: ['POST'] })
    expect(out.map((r) => r.id)).toEqual(['b'])
  })

  it('filters by status class', () => {
    const out = applyFilter(reqs, { ...EMPTY_FILTER, statusClasses: ['4xx'] })
    expect(out.map((r) => r.id)).toEqual(['b'])
  })

  it('filters by url regex (AND with others)', () => {
    const out = applyFilter(reqs, { ...EMPTY_FILTER, query: 'login' })
    expect(out.map((r) => r.id)).toEqual(['b'])
  })

  it('can include static when toggled off', () => {
    const out = applyFilter(reqs, { ...EMPTY_FILTER, hideStaticAssets: false })
    expect(out.map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('matches response body via bodyQuery', () => {
    const resBodies = {
      a: { state: 'loaded' as const, body: '{"role":"admin"}' },
      b: { state: 'loaded' as const, body: '{"role":"user"}' },
    }
    const out = applyFilter(reqs, { ...EMPTY_FILTER, bodyQuery: 'admin' }, resBodies)
    expect(out.map((r) => r.id)).toEqual(['a'])
  })

  it('matches request body via bodyQuery', () => {
    const withBody = [
      makeRequest({ id: 'p', method: 'POST', reqBody: { kind: 'json', raw: '{"q":"needle"}' } }),
    ]
    const out = applyFilter(withBody, { ...EMPTY_FILTER, bodyQuery: 'needle' })
    expect(out.map((r) => r.id)).toEqual(['p'])
  })

  it('excludes when bodyQuery has no match and no loaded body', () => {
    const out = applyFilter(reqs, { ...EMPTY_FILTER, bodyQuery: 'zzz' })
    expect(out).toHaveLength(0)
  })
})
