import type { CapturedRequest, RequestBody } from '../types'
import { headersToRecord, getHeader, type HarHeader } from './headers'

export interface HarPostParam {
  name: string
  value?: string
  fileName?: string
}

export interface HarPostData {
  mimeType?: string
  text?: string
  params?: HarPostParam[]
}

export interface HarEntryLike {
  request: {
    method: string
    url: string
    headers: HarHeader[]
    queryString?: { name: string; value: string }[]
    postData?: HarPostData
  }
  response: {
    status: number
    statusText: string
    headers: HarHeader[]
    content?: { size?: number; mimeType?: string }
  }
  time: number
  startedDateTime: string
  _resourceType?: string
}

let seq = 0

export function resetSeq(): void {
  seq = 0
}

function looksLikeJson(text: string): boolean {
  const t = text.trimStart()
  return t.startsWith('{') || t.startsWith('[')
}

export function parseBody(
  postData: HarPostData | undefined,
  headers: Record<string, string>,
): RequestBody {
  if (!postData) return { kind: 'none' }
  const mime = (
    postData.mimeType ||
    getHeader(headers, 'content-type') ||
    ''
  ).toLowerCase()

  if (postData.params && postData.params.length > 0) {
    if (mime.includes('multipart/form-data')) {
      return {
        kind: 'multipart',
        parts: postData.params.map((p) => ({ name: p.name, filename: p.fileName })),
      }
    }
    return {
      kind: 'form',
      pairs: postData.params.map((p) => [p.name, p.value ?? ''] as [string, string]),
    }
  }

  const text = postData.text ?? ''
  if (!text) return { kind: 'none' }

  if (mime.includes('application/json') || looksLikeJson(text)) {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = undefined
    }
    return { kind: 'json', raw: text, parsed }
  }

  if (mime.includes('application/x-www-form-urlencoded')) {
    const pairs: [string, string][] = []
    for (const part of text.split('&')) {
      if (!part) continue
      const idx = part.indexOf('=')
      const rawKey = idx >= 0 ? part.slice(0, idx) : part
      const rawValue = idx >= 0 ? part.slice(idx + 1) : ''
      pairs.push([safeDecode(rawKey), safeDecode(rawValue)])
    }
    return { kind: 'form', pairs }
  }

  return { kind: 'text', raw: text }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

export function normalize(entry: HarEntryLike, now: number): CapturedRequest {
  const { request, response } = entry
  const url = request.url
  let origin = ''
  let path = url
  try {
    const u = new URL(url)
    origin = u.origin
    path = u.pathname + u.search
  } catch {
    origin = ''
    path = url
  }

  const reqHeaders = headersToRecord(request.headers)
  const resHeaders = headersToRecord(response.headers)
  const parsedStart = Date.parse(entry.startedDateTime)
  const startedAt = Number.isNaN(parsedStart) ? now : parsedStart

  return {
    id: `${startedAt}-${seq++}`,
    startedAt,
    method: request.method,
    url,
    origin,
    path,
    query: (request.queryString ?? []).map(
      (q) => [q.name, q.value] as [string, string],
    ),
    status: response.status,
    statusText: response.statusText,
    type: entry._resourceType ?? 'other',
    durationMs: Math.max(0, Math.round(entry.time)),
    sizeBytes: response.content?.size ?? 0,
    reqHeaders,
    reqBody: parseBody(request.postData, reqHeaders),
    resHeaders,
    resMime: response.content?.mimeType,
  }
}
