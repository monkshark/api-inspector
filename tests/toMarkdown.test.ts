import { describe, it, expect } from 'vitest'
import { toMarkdown } from '../src/core/export/toMarkdown'
import { makeRequest } from './fixtures'

describe('toMarkdown', () => {
  it('groups requests by method and pathname ignoring query', () => {
    const md = toMarkdown([
      makeRequest({ url: 'https://api.example.com/v1/users?page=1' }),
      makeRequest({ url: 'https://api.example.com/v1/users?page=2' }),
    ])
    expect(md).toContain('2 requests · 1 endpoints')
    expect(md).toContain('## GET https://api.example.com/v1/users')
    expect(md).toContain('- Calls: 2')
  })

  it('lists distinct statuses and query keys', () => {
    const md = toMarkdown([
      makeRequest({ status: 200, query: [['page', '1']] }),
      makeRequest({ status: 500, query: [['sort', 'asc']] }),
    ])
    expect(md).toContain('- Status: 200, 500')
    expect(md).toContain('- Query: page, sort')
  })

  it('separates different endpoints', () => {
    const md = toMarkdown([
      makeRequest({ url: 'https://api.example.com/a', method: 'GET' }),
      makeRequest({ url: 'https://api.example.com/b', method: 'POST' }),
    ])
    expect(md).toContain('2 requests · 2 endpoints')
  })
})
