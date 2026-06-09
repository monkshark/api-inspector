import { describe, it, expect } from 'vitest'
import { buildSession, parseImport } from '../src/core/session'
import { makeRequest } from './fixtures'

describe('session round-trip', () => {
  it('exports and re-imports requests and response bodies', () => {
    const reqs = [makeRequest({ id: 'a' }), makeRequest({ id: 'b' })]
    const bodies = { a: { state: 'loaded' as const, body: '{"ok":1}' } }
    const json = buildSession(reqs, bodies)

    const out = parseImport(json, 0)
    expect(out.requests.map((r) => r.id)).toEqual(['a', 'b'])
    expect(out.resBodies['a'].body).toBe('{"ok":1}')
  })
})

describe('parseImport format detection', () => {
  it('falls back to HAR for a HAR file', () => {
    const har = JSON.stringify({
      log: {
        entries: [
          {
            startedDateTime: '2026-01-01T00:00:00.000Z',
            time: 10,
            request: {
              method: 'GET',
              url: 'https://api.example.com/x',
              headers: [],
              queryString: [],
            },
            response: {
              status: 200,
              statusText: 'OK',
              headers: [],
              content: { size: 0, mimeType: 'application/json' },
            },
          },
        ],
      },
    })
    const out = parseImport(har, 0)
    expect(out.requests).toHaveLength(1)
    expect(out.requests[0].url).toBe('https://api.example.com/x')
  })

  it('throws on invalid json', () => {
    expect(() => parseImport('nope', 0)).toThrow()
  })

  it('throws on json that is neither a session nor a HAR', () => {
    expect(() => parseImport('{"foo":1}', 0)).toThrow()
  })
})
