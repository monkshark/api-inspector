import type { CapturedRequest, ResBodyEntry } from '../types'
import { normalize, type HarEntryLike } from './normalize'
import { decodeContent } from './mime'

export interface ParsedHar {
  requests: CapturedRequest[]
  resBodies: Record<string, ResBodyEntry>
}

function headersArray(rec: Record<string, string>) {
  return Object.entries(rec).map(([name, value]) => ({ name, value }))
}

function postDataOf(req: CapturedRequest) {
  const b = req.reqBody
  if (b.kind === 'json') return { mimeType: 'application/json', text: b.raw }
  if (b.kind === 'text') return { mimeType: 'text/plain', text: b.raw }
  if (b.kind === 'form')
    return {
      mimeType: 'application/x-www-form-urlencoded',
      text: b.pairs
        .map(
          ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
        )
        .join('&'),
      params: b.pairs.map(([name, value]) => ({ name, value })),
    }
  if (b.kind === 'multipart')
    return {
      mimeType: 'multipart/form-data',
      params: b.parts.map((p) => ({ name: p.name, fileName: p.filename })),
    }
  return undefined
}

function toIso(epochMs: number): string {
  const d = new Date(epochMs)
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString()
}

export function buildHar(
  requests: CapturedRequest[],
  resBodies: Record<string, ResBodyEntry>,
): string {
  const entries = requests.map((req) => {
    const postData = postDataOf(req)
    const body = resBodies[req.id]?.body
    return {
      startedDateTime: toIso(req.startedAt),
      time: req.durationMs,
      _resourceType: req.type,
      request: {
        method: req.method,
        url: req.url,
        httpVersion: 'HTTP/1.1',
        headers: headersArray(req.reqHeaders),
        queryString: req.query.map(([name, value]) => ({ name, value })),
        cookies: [],
        headersSize: -1,
        bodySize: -1,
        ...(postData ? { postData } : {}),
      },
      response: {
        status: req.status,
        statusText: req.statusText,
        httpVersion: 'HTTP/1.1',
        headers: headersArray(req.resHeaders),
        cookies: [],
        content: {
          size: req.sizeBytes,
          mimeType: req.resMime ?? '',
          ...(body != null ? { text: body } : {}),
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: -1,
      },
      cache: {},
      timings: { send: -1, wait: req.durationMs, receive: -1 },
    }
  })

  return JSON.stringify(
    {
      log: {
        version: '1.2',
        creator: { name: 'API Inspector', version: '1.0.0' },
        entries,
      },
    },
    null,
    2,
  )
}

interface HarContent {
  size?: number
  mimeType?: string
  text?: string
  encoding?: string
}

function getEntries(data: unknown): unknown[] {
  if (data && typeof data === 'object' && 'log' in data) {
    const log = (data as { log?: unknown }).log
    if (log && typeof log === 'object' && 'entries' in log) {
      const entries = (log as { entries?: unknown }).entries
      if (Array.isArray(entries)) return entries
    }
  }
  throw new Error('HAR 형식이 아닙니다 (log.entries 없음).')
}

export function parseHar(jsonText: string, now: number): ParsedHar {
  let data: unknown
  try {
    data = JSON.parse(jsonText)
  } catch {
    throw new Error('유효한 JSON이 아닙니다.')
  }

  const entries = getEntries(data)
  const requests: CapturedRequest[] = []
  const resBodies: Record<string, ResBodyEntry> = {}

  for (const e of entries) {
    if (!e || typeof e !== 'object') continue
    const rec = e as Record<string, unknown>
    if (!rec.request || !rec.response) continue

    const req = normalize(e as HarEntryLike, now)
    requests.push(req)

    const content = (rec.response as { content?: HarContent }).content
    if (content && typeof content.text === 'string') {
      resBodies[req.id] = decodeContent(
        content.text,
        content.encoding,
        content.mimeType ?? req.resMime,
      )
    }
  }

  if (requests.length === 0) {
    throw new Error('가져올 요청이 없습니다.')
  }

  return { requests, resBodies }
}
