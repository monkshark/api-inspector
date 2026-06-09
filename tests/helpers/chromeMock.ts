type RequestListener = (entry: unknown) => void

const listeners: RequestListener[] = []

export const chromeMock = {
  devtools: {
    network: {
      onRequestFinished: {
        addListener: (l: RequestListener) => listeners.push(l),
        removeListener: (l: RequestListener) => {
          const i = listeners.indexOf(l)
          if (i >= 0) listeners.splice(i, 1)
        },
      },
    },
    inspectedWindow: { reload: () => {} },
    panels: { create: () => {} },
  },
}

export function resetChromeMock(): void {
  listeners.length = 0
}

export function emitRequest(entry: unknown): void {
  for (const l of [...listeners]) l(entry)
}

export interface EntryOptions {
  method?: string
  url?: string
  status?: number
  type?: string
  reqHeaders?: Record<string, string>
  resMime?: string
  postJson?: string
  resText?: string
}

export function entry(opts: EntryOptions = {}) {
  const url = opts.url ?? 'https://api.example.com/v1/users?page=2'
  const u = new URL(url)
  const reqHeaders = Object.entries(
    opts.reqHeaders ?? { Accept: 'application/json' },
  ).map(([name, value]) => ({ name, value }))

  return {
    startedDateTime: '2026-01-01T00:00:00.000Z',
    time: 100,
    _resourceType: opts.type ?? 'xhr',
    request: {
      method: opts.method ?? 'GET',
      url,
      headers: reqHeaders,
      queryString: [...u.searchParams.entries()].map(([name, value]) => ({
        name,
        value,
      })),
      ...(opts.postJson
        ? { postData: { mimeType: 'application/json', text: opts.postJson } }
        : {}),
    },
    response: {
      status: opts.status ?? 200,
      statusText: 'OK',
      headers: [{ name: 'Content-Type', value: opts.resMime ?? 'application/json' }],
      content: { size: 20, mimeType: opts.resMime ?? 'application/json' },
    },
    getContent: (cb: (content: string, encoding: string) => void) =>
      cb(opts.resText ?? '{"id":1}', ''),
  }
}
