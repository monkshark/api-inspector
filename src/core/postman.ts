import type { CapturedRequest } from '../types'
import { normalize, type HarEntryLike } from './normalize'

interface PmHeader {
  key: string
  value?: string
  disabled?: boolean
}

interface PmBody {
  mode?: string
  raw?: string
  options?: { raw?: { language?: string } }
  urlencoded?: { key: string; value?: string }[]
  formdata?: { key: string; type?: string; value?: string; src?: string }[]
}

interface PmRequest {
  method?: string
  header?: PmHeader[]
  url?: string | { raw?: string }
  body?: PmBody
}

interface PmItem {
  name?: string
  request?: PmRequest
  item?: PmItem[]
}

export function isPostmanCollection(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return !!d.info && Array.isArray(d.item)
}

function flatten(items: PmItem[], out: PmItem[]): void {
  for (const it of items) {
    if (Array.isArray(it.item)) flatten(it.item, out)
    else if (it.request) out.push(it)
  }
}

function urlString(url: PmRequest['url']): string {
  if (!url) return ''
  if (typeof url === 'string') return url
  return url.raw ?? ''
}

function toPostData(body: PmBody | undefined) {
  if (!body) return undefined
  if (body.mode === 'raw' && body.raw != null) {
    const lang = body.options?.raw?.language
    return {
      mimeType: lang === 'json' ? 'application/json' : 'text/plain',
      text: body.raw,
    }
  }
  if (body.mode === 'urlencoded' && body.urlencoded) {
    return {
      mimeType: 'application/x-www-form-urlencoded',
      params: body.urlencoded.map((p) => ({ name: p.key, value: p.value ?? '' })),
    }
  }
  if (body.mode === 'formdata' && body.formdata) {
    return {
      mimeType: 'multipart/form-data',
      params: body.formdata.map((p) => ({
        name: p.key,
        value: p.value,
        fileName: p.src,
      })),
    }
  }
  return undefined
}

export function parsePostman(data: unknown, now: number): CapturedRequest[] {
  if (!isPostmanCollection(data)) {
    throw new Error('Postman 컬렉션 형식이 아닙니다.')
  }
  const leaves: PmItem[] = []
  flatten((data as { item: PmItem[] }).item, leaves)

  const out: CapturedRequest[] = []
  for (const leaf of leaves) {
    const r = leaf.request
    if (!r) continue
    const url = urlString(r.url)
    let queryString: { name: string; value: string }[] = []
    try {
      const u = new URL(url)
      queryString = [...u.searchParams.entries()].map(([name, value]) => ({
        name,
        value,
      }))
    } catch {
      queryString = []
    }
    const headers = (r.header ?? [])
      .filter((h) => !h.disabled && h.key)
      .map((h) => ({ name: h.key, value: h.value ?? '' }))

    const entry: HarEntryLike = {
      startedDateTime: '',
      time: 0,
      _resourceType: 'fetch',
      request: {
        method: r.method ?? 'GET',
        url,
        headers,
        queryString,
        postData: toPostData(r.body),
      },
      response: { status: 0, statusText: '', headers: [], content: { size: 0 } },
    }
    out.push(normalize(entry, now))
  }

  if (out.length === 0) throw new Error('가져올 요청이 없습니다.')
  return out
}
