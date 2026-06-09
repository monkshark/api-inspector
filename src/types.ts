export type RequestBody =
  | { kind: 'json'; raw: string; parsed?: unknown }
  | { kind: 'form'; pairs: [string, string][] }
  | { kind: 'multipart'; parts: { name: string; filename?: string }[] }
  | { kind: 'text'; raw: string }
  | { kind: 'none' }

export interface CapturedRequest {
  id: string
  startedAt: number
  method: string
  url: string
  origin: string
  path: string
  query: [string, string][]
  status: number
  statusText: string
  type: string
  durationMs: number
  sizeBytes: number
  reqHeaders: Record<string, string>
  reqBody: RequestBody
  resHeaders: Record<string, string>
  resMime?: string
}

export type ResBodyState = 'idle' | 'loading' | 'loaded' | 'error' | 'truncated' | 'binary'

export interface ResBodyEntry {
  state: ResBodyState
  body?: string
  mime?: string
}

export type ConvertFormat = 'curl' | 'httpie'
