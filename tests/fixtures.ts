import type { CapturedRequest, RequestBody } from '../src/types'

export function makeRequest(over: Partial<CapturedRequest> = {}): CapturedRequest {
  const base: CapturedRequest = {
    id: '1-0',
    startedAt: 0,
    method: 'GET',
    url: 'https://api.example.com/v1/users?page=2',
    origin: 'https://api.example.com',
    path: '/v1/users?page=2',
    query: [['page', '2']],
    status: 200,
    statusText: 'OK',
    type: 'xhr',
    durationMs: 120,
    sizeBytes: 512,
    reqHeaders: { Accept: 'application/json' },
    reqBody: { kind: 'none' } as RequestBody,
    resHeaders: { 'Content-Type': 'application/json' },
    resMime: 'application/json',
  }
  return { ...base, ...over }
}
