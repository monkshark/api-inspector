import type { CapturedRequest } from '../../types'
import { maskHeaders, maskUrl, maskText } from '../mask'
import type { ConvertOptions } from './shell'

interface PostmanUrl {
  raw: string
  protocol?: string
  host?: string[]
  path?: string[]
  query?: { key: string; value: string }[]
}

function buildUrl(raw: string): PostmanUrl {
  try {
    const u = new URL(raw)
    return {
      raw,
      protocol: u.protocol.replace(':', ''),
      host: u.hostname.split('.'),
      path: u.pathname.split('/').filter(Boolean),
      query: [...u.searchParams.entries()].map(([key, value]) => ({ key, value })),
    }
  } catch {
    return { raw }
  }
}

function buildBody(req: CapturedRequest, mask: boolean): unknown {
  const b = req.reqBody
  if (b.kind === 'json')
    return {
      mode: 'raw',
      raw: maskText(b.raw, mask),
      options: { raw: { language: 'json' } },
    }
  if (b.kind === 'text')
    return {
      mode: 'raw',
      raw: maskText(b.raw, mask),
      options: { raw: { language: 'text' } },
    }
  if (b.kind === 'form')
    return {
      mode: 'urlencoded',
      urlencoded: b.pairs.map(([key, value]) => ({
        key,
        value: maskText(value, mask),
      })),
    }
  if (b.kind === 'multipart')
    return {
      mode: 'formdata',
      formdata: b.parts.map((p) =>
        p.filename
          ? { key: p.name, type: 'file', src: p.filename }
          : { key: p.name, type: 'text', value: '' },
      ),
    }
  return null
}

export function toPostman(
  reqs: CapturedRequest[],
  opts: ConvertOptions & { name?: string },
): string {
  const item = reqs.map((req) => {
    const url = maskUrl(req.url, opts.mask)
    const headers = maskHeaders(req.reqHeaders, {
      enabled: opts.mask,
      maskKeys: opts.maskKeys,
    })
    const body = buildBody(req, opts.mask)
    return {
      name: `${req.method.toUpperCase()} ${req.path}`,
      request: {
        method: req.method.toUpperCase(),
        header: Object.entries(headers).map(([key, value]) => ({ key, value })),
        url: buildUrl(url),
        ...(body ? { body } : {}),
      },
    }
  })

  return JSON.stringify(
    {
      info: {
        name: opts.name ?? 'API Inspector Export',
        schema:
          'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item,
    },
    null,
    2,
  )
}
