import type { CapturedRequest } from '../types'
import { bodyToString } from './diff'

export interface FilterState {
  query: string
  bodyQuery: string
  methods: string[]
  statusClasses: string[]
  hideStaticAssets: boolean
}

export const EMPTY_FILTER: FilterState = {
  query: '',
  bodyQuery: '',
  methods: [],
  statusClasses: [],
  hideStaticAssets: true,
}

export const STATIC_TYPES = new Set([
  'stylesheet',
  'image',
  'font',
  'script',
  'media',
  'manifest',
])

export function statusClass(status: number): string {
  if (status >= 500) return '5xx'
  if (status >= 400) return '4xx'
  if (status >= 300) return '3xx'
  if (status >= 200) return '2xx'
  return 'pending'
}

export function isValidRegex(query: string): boolean {
  if (!query) return true
  try {
    new RegExp(query)
    return true
  } catch {
    return false
  }
}

export function makeUrlMatcher(query: string): (url: string) => boolean {
  if (!query) return () => true
  try {
    const re = new RegExp(query, 'i')
    return (url) => re.test(url)
  } catch {
    const lower = query.toLowerCase()
    return (url) => url.toLowerCase().includes(lower)
  }
}

export interface BodyLookup {
  [id: string]: { body?: string } | undefined
}

export function applyFilter(
  reqs: CapturedRequest[],
  filter: FilterState,
  resBodies?: BodyLookup,
): CapturedRequest[] {
  const matchUrl = makeUrlMatcher(filter.query)
  const methodSet = filter.methods.length ? new Set(filter.methods) : null
  const statusSet = filter.statusClasses.length ? new Set(filter.statusClasses) : null
  const bodyQuery = filter.bodyQuery.trim().toLowerCase()

  return reqs.filter((r) => {
    if (filter.hideStaticAssets && STATIC_TYPES.has(r.type)) return false
    if (methodSet && !methodSet.has(r.method.toUpperCase())) return false
    if (statusSet && !statusSet.has(statusClass(r.status))) return false
    if (!matchUrl(r.url)) return false
    if (bodyQuery) {
      const reqText = bodyToString(r.reqBody).toLowerCase()
      const resText = (resBodies?.[r.id]?.body ?? '').toLowerCase()
      if (!reqText.includes(bodyQuery) && !resText.includes(bodyQuery)) return false
    }
    return true
  })
}
