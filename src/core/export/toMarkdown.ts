import type { CapturedRequest } from '../../types'
import { getHeader } from '../headers'

function pathnameOf(req: CapturedRequest): string {
  try {
    return new URL(req.url).pathname
  } catch {
    return req.path
  }
}

function endpointKey(req: CapturedRequest): string {
  return `${req.method.toUpperCase()} ${req.origin}${pathnameOf(req)}`
}

export function toMarkdown(
  reqs: CapturedRequest[],
  opts: { title?: string } = {},
): string {
  const groups = new Map<string, CapturedRequest[]>()
  for (const r of reqs) {
    const key = endpointKey(r)
    const arr = groups.get(key) ?? []
    arr.push(r)
    groups.set(key, arr)
  }

  const lines: string[] = [
    `# ${opts.title ?? 'API Endpoints'}`,
    '',
    `> ${reqs.length} requests · ${groups.size} endpoints`,
    '',
  ]

  for (const [key, list] of [...groups.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const rep = list[0]
    const statuses = [...new Set(list.map((r) => r.status))]
      .sort((a, b) => a - b)
      .join(', ')
    const queryKeys = [
      ...new Set(list.flatMap((r) => r.query.map(([k]) => k))),
    ]
    const reqCt = getHeader(rep.reqHeaders, 'content-type')

    lines.push(`## ${key}`, '')
    lines.push(`- Calls: ${list.length}`)
    lines.push(`- Status: ${statuses}`)
    if (queryKeys.length) lines.push(`- Query: ${queryKeys.join(', ')}`)
    if (reqCt) lines.push(`- Request Content-Type: ${reqCt}`)
    if (rep.resMime) lines.push(`- Response: ${rep.resMime}`)
    lines.push('')
  }

  return lines.join('\n')
}
