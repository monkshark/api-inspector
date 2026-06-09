import type { CapturedRequest } from '../../types'
import { maskHeaders, maskUrl, maskText } from '../mask'
import { singleQuote, type ConvertOptions } from './shell'

export function toHttpie(req: CapturedRequest, opts: ConvertOptions): string {
  const url = maskUrl(req.url, opts.mask)
  const headers = maskHeaders(req.reqHeaders, {
    enabled: opts.mask,
    maskKeys: opts.maskKeys,
  })

  const parts: string[] = ['http', req.method.toUpperCase(), singleQuote(url)]

  for (const [key, value] of Object.entries(headers)) {
    parts.push(singleQuote(`${key}:${value}`))
  }

  const body = req.reqBody
  if (body.kind === 'form') {
    for (const [key, value] of body.pairs) {
      parts.push(singleQuote(`${key}=${maskText(value, opts.mask)}`))
    }
  } else if (body.kind === 'json' || body.kind === 'text') {
    parts.push(`--raw ${singleQuote(maskText(body.raw, opts.mask))}`)
  }

  return parts.join(' ')
}
