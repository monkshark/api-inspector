import { describe, it, expect, beforeEach } from 'vitest'
import { normalize, parseBody, resetSeq, type HarEntryLike } from '../src/core/normalize'
import { headersToRecord, getHeader } from '../src/core/headers'

function entry(over: Partial<HarEntryLike> = {}): HarEntryLike {
  return {
    request: {
      method: 'GET',
      url: 'https://api.example.com/v1/users?page=2',
      headers: [{ name: 'Accept', value: 'application/json' }],
      queryString: [{ name: 'page', value: '2' }],
    },
    response: {
      status: 200,
      statusText: 'OK',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      content: { size: 512, mimeType: 'application/json' },
    },
    time: 119.6,
    startedDateTime: '2026-01-01T00:00:00.000Z',
    _resourceType: 'xhr',
    ...over,
  }
}

beforeEach(() => resetSeq())

describe('headersToRecord', () => {
  it('joins duplicate header names', () => {
    const out = headersToRecord([
      { name: 'Set-Cookie', value: 'a=1' },
      { name: 'Set-Cookie', value: 'b=2' },
    ])
    expect(out['Set-Cookie']).toBe('a=1, b=2')
  })
  it('getHeader is case-insensitive', () => {
    expect(getHeader({ 'Content-Type': 'x' }, 'content-type')).toBe('x')
  })
})

describe('normalize', () => {
  it('extracts origin, path, and rounds time', () => {
    const r = normalize(entry(), 1000)
    expect(r.origin).toBe('https://api.example.com')
    expect(r.path).toBe('/v1/users?page=2')
    expect(r.durationMs).toBe(120)
    expect(r.query).toEqual([['page', '2']])
    expect(r.type).toBe('xhr')
  })

  it('falls back to now for invalid date', () => {
    const r = normalize(entry({ startedDateTime: 'bogus' }), 4242)
    expect(r.startedAt).toBe(4242)
  })

  it('increments sequence for unique ids', () => {
    const a = normalize(entry(), 0)
    const b = normalize(entry(), 0)
    expect(a.id).not.toBe(b.id)
  })
})

describe('parseBody', () => {
  it('returns none without postData', () => {
    expect(parseBody(undefined, {})).toEqual({ kind: 'none' })
  })
  it('parses json bodies', () => {
    const b = parseBody({ mimeType: 'application/json', text: '{"a":1}' }, {})
    expect(b.kind).toBe('json')
    if (b.kind === 'json') expect(b.parsed).toEqual({ a: 1 })
  })
  it('detects json by shape without mime', () => {
    const b = parseBody({ text: '[1,2,3]' }, {})
    expect(b.kind).toBe('json')
  })
  it('parses urlencoded form', () => {
    const b = parseBody(
      { mimeType: 'application/x-www-form-urlencoded', text: 'a=1&b=hello+world' },
      {},
    )
    expect(b).toEqual({ kind: 'form', pairs: [['a', '1'], ['b', 'hello world']] })
  })
  it('parses multipart params', () => {
    const b = parseBody(
      {
        mimeType: 'multipart/form-data; boundary=x',
        params: [{ name: 'file', fileName: 'a.png' }, { name: 'note', value: 'hi' }],
      },
      {},
    )
    expect(b.kind).toBe('multipart')
    if (b.kind === 'multipart')
      expect(b.parts).toEqual([{ name: 'file', filename: 'a.png' }, { name: 'note', filename: undefined }])
  })
  it('falls back to text', () => {
    const b = parseBody({ mimeType: 'text/plain', text: 'hello' }, {})
    expect(b).toEqual({ kind: 'text', raw: 'hello' })
  })
})
