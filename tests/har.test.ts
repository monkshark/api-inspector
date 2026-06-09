import { describe, it, expect } from 'vitest'
import { parseHar } from '../src/core/har'

function harJson(over?: { encoding?: string; text?: string; mimeType?: string }) {
  return JSON.stringify({
    log: {
      version: '1.2',
      entries: [
        {
          startedDateTime: '2026-01-01T00:00:00.000Z',
          time: 42,
          _resourceType: 'fetch',
          request: {
            method: 'POST',
            url: 'https://api.example.com/v1/login?next=/home',
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            queryString: [{ name: 'next', value: '/home' }],
            postData: { mimeType: 'application/json', text: '{"u":"a"}' },
          },
          response: {
            status: 200,
            statusText: 'OK',
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            content: {
              size: 12,
              mimeType: over?.mimeType ?? 'application/json',
              text: over?.text ?? '{"ok":true}',
              encoding: over?.encoding,
            },
          },
        },
      ],
    },
  })
}

describe('parseHar', () => {
  it('parses entries into CapturedRequest', () => {
    const { requests } = parseHar(harJson(), 1000)
    expect(requests).toHaveLength(1)
    expect(requests[0].method).toBe('POST')
    expect(requests[0].path).toBe('/v1/login?next=/home')
    expect(requests[0].reqBody.kind).toBe('json')
  })

  it('extracts inline response body', () => {
    const { requests, resBodies } = parseHar(harJson(), 1000)
    const id = requests[0].id
    expect(resBodies[id].state).toBe('loaded')
    expect(resBodies[id].body).toBe('{"ok":true}')
  })

  it('decodes base64-encoded text bodies', () => {
    const encoded = btoa('{"hello":1}')
    const { requests, resBodies } = parseHar(
      harJson({ encoding: 'base64', text: encoded }),
      1000,
    )
    expect(resBodies[requests[0].id].body).toBe('{"hello":1}')
  })

  it('marks base64 binary bodies', () => {
    const { requests, resBodies } = parseHar(
      harJson({ encoding: 'base64', text: 'AAAA', mimeType: 'image/png' }),
      1000,
    )
    expect(resBodies[requests[0].id].state).toBe('binary')
  })

  it('throws on invalid json', () => {
    expect(() => parseHar('not json', 0)).toThrow()
  })

  it('throws when log.entries missing', () => {
    expect(() => parseHar('{"foo":1}', 0)).toThrow()
  })
})
