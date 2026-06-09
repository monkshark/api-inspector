import { describe, it, expect } from 'vitest'
import { diffRecords, diffRequests, bodyToString } from '../src/core/diff'
import { makeRequest } from './fixtures'

describe('diffRecords', () => {
  it('classifies added/removed/changed/same', () => {
    const rows = diffRecords({ a: '1', b: '2', c: '3' }, { a: '1', b: '9', d: '4' })
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.state]))
    expect(byKey['a']).toBe('same')
    expect(byKey['b']).toBe('changed')
    expect(byKey['c']).toBe('removed')
    expect(byKey['d']).toBe('added')
  })
})

describe('bodyToString', () => {
  it('serializes each body kind', () => {
    expect(bodyToString({ kind: 'none' })).toBe('')
    expect(bodyToString({ kind: 'json', raw: '{"a":1}' })).toBe('{"a":1}')
    expect(bodyToString({ kind: 'form', pairs: [['a', '1'], ['b', '2']] })).toBe('a=1\nb=2')
    expect(
      bodyToString({ kind: 'multipart', parts: [{ name: 'f', filename: 'x.png' }] }),
    ).toBe('f=@x.png')
  })
})

describe('diffRequests', () => {
  it('detects status and body changes', () => {
    const a = makeRequest({ status: 200, reqBody: { kind: 'json', raw: '{"a":1}' } })
    const b = makeRequest({ status: 500, reqBody: { kind: 'json', raw: '{"a":2}' } })
    const d = diffRequests(a, b)
    expect(d.status.state).toBe('changed')
    expect(d.reqBody.changed).toBe(true)
  })

  it('reports same body when identical', () => {
    const a = makeRequest({ reqBody: { kind: 'text', raw: 'x' } })
    const b = makeRequest({ reqBody: { kind: 'text', raw: 'x' } })
    expect(diffRequests(a, b).reqBody.changed).toBe(false)
  })

  it('diffs query parameters', () => {
    const a = makeRequest({ query: [['page', '1']] })
    const b = makeRequest({ query: [['page', '2']] })
    const row = diffRequests(a, b).query.find((r) => r.key === 'page')
    expect(row?.state).toBe('changed')
  })
})
