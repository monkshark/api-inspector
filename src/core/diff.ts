import type { CapturedRequest, RequestBody } from '../types'

export type DiffState = 'same' | 'added' | 'removed' | 'changed'

export interface DiffRow {
  key: string
  a?: string
  b?: string
  state: DiffState
}

export function diffRecords(
  a: Record<string, string>,
  b: Record<string, string>,
): DiffRow[] {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  return keys.map((key) => {
    const av = a[key]
    const bv = b[key]
    let state: DiffState
    if (av === undefined) state = 'added'
    else if (bv === undefined) state = 'removed'
    else if (av !== bv) state = 'changed'
    else state = 'same'
    return { key, a: av, b: bv, state }
  })
}

function queryRecord(req: CapturedRequest): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of req.query) out[k] = k in out ? `${out[k]}, ${v}` : v
  return out
}

export function bodyToString(body: RequestBody): string {
  switch (body.kind) {
    case 'json':
    case 'text':
      return body.raw
    case 'form':
      return body.pairs.map(([k, v]) => `${k}=${v}`).join('\n')
    case 'multipart':
      return body.parts
        .map((p) => (p.filename ? `${p.name}=@${p.filename}` : p.name))
        .join('\n')
    case 'none':
      return ''
  }
}

export interface RequestDiff {
  status: DiffRow
  reqHeaders: DiffRow[]
  resHeaders: DiffRow[]
  query: DiffRow[]
  reqBody: { a: string; b: string; changed: boolean }
}

export function diffRequests(
  a: CapturedRequest,
  b: CapturedRequest,
): RequestDiff {
  const bodyA = bodyToString(a.reqBody)
  const bodyB = bodyToString(b.reqBody)
  return {
    status: {
      key: 'status',
      a: String(a.status),
      b: String(b.status),
      state: a.status === b.status ? 'same' : 'changed',
    },
    reqHeaders: diffRecords(a.reqHeaders, b.reqHeaders),
    resHeaders: diffRecords(a.resHeaders, b.resHeaders),
    query: diffRecords(queryRecord(a), queryRecord(b)),
    reqBody: { a: bodyA, b: bodyB, changed: bodyA !== bodyB },
  }
}
