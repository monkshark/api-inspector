import type { CapturedRequest, ResBodyEntry } from '../types'
import { normalize, type HarEntryLike } from './normalize'
import { decodeContent } from './mime'

export interface ParsedHar {
  requests: CapturedRequest[]
  resBodies: Record<string, ResBodyEntry>
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
