import type { CapturedRequest } from '../../types'
import { maskHeaders, maskUrl, maskText } from '../mask'
import { singleQuote, type ConvertOptions } from './shell'

export function toCurl(req: CapturedRequest, opts: ConvertOptions): string {
  const cont = opts.windows ? ' ^\n  ' : ' \\\n  '
  const url = maskUrl(req.url, opts.mask)
  const headers = maskHeaders(req.reqHeaders, {
    enabled: opts.mask,
    maskKeys: opts.maskKeys,
  })

  const lines: string[] = [`curl ${singleQuote(url)}`]
  const method = req.method.toUpperCase()
  if (method !== 'GET') lines.push(`-X ${method}`)

  for (const [key, value] of Object.entries(headers)) {
    lines.push(`-H ${singleQuote(`${key}: ${value}`)}`)
  }

  const body = req.reqBody
  if (body.kind === 'json' || body.kind === 'text') {
    lines.push(`--data-raw ${singleQuote(maskText(body.raw, opts.mask))}`)
  } else if (body.kind === 'form') {
    for (const [key, value] of body.pairs) {
      lines.push(
        `--data-urlencode ${singleQuote(`${key}=${maskText(value, opts.mask)}`)}`,
      )
    }
  } else if (body.kind === 'multipart') {
    for (const part of body.parts) {
      lines.push(
        part.filename
          ? `-F ${singleQuote(`${part.name}=@${part.filename}`)}`
          : `-F ${singleQuote(`${part.name}=`)}`,
      )
    }
  }

  return lines.join(cont)
}
