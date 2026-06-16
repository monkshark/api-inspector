import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  BgToUi,
  HeaderEntry,
  PausedEdit,
  PausedItem,
  TabInfo,
} from '../core/intercept-types'

const FIELD =
  'w-full rounded-md border border-bd bg-bg px-2 py-1 font-mono text-[12px] text-tx outline-none'

function headersToText(headers: HeaderEntry[]): string {
  return headers.map((h) => `${h.name}: ${h.value}`).join('\n')
}

function textToHeaders(text: string): HeaderEntry[] {
  const out: HeaderEntry[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const at = line.indexOf(':')
    if (at < 0) continue
    out.push({ name: line.slice(0, at).trim(), value: line.slice(at + 1).trim() })
  }
  return out
}

interface Draft {
  url: string
  method: string
  status: string
  headersText: string
  body: string
}

function draftOf(item: PausedItem): Draft {
  return {
    url: item.url,
    method: item.method,
    status: item.status != null ? String(item.status) : '',
    headersText: headersToText(item.headers),
    body: item.body,
  }
}

export default function App() {
  const portRef = useRef<chrome.runtime.Port | null>(null)
  const [tabs, setTabs] = useState<TabInfo[]>([])
  const [targetTab, setTargetTab] = useState<number | null>(null)
  const [attached, setAttached] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [filter, setFilter] = useState('')
  const [queue, setQueue] = useState<PausedItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [note, setNote] = useState('')

  const refreshTabs = () => {
    chrome.tabs.query({}, (list) => {
      setTabs(
        list
          .filter((t) => t.id != null && /^https?:/.test(t.url ?? ''))
          .map((t) => ({ id: t.id as number, title: t.title ?? '', url: t.url ?? '' })),
      )
    })
  }

  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'intercept' })
    portRef.current = port
    port.onMessage.addListener((msg: BgToUi) => {
      if (msg.type === 'attached') {
        setAttached(true)
        setNote('')
      } else if (msg.type === 'detached') {
        setAttached(false)
        setQueue([])
        setActiveId(null)
        if (msg.reason === 'external') setNote('Detached (DevTools opened or tab closed).')
      } else if (msg.type === 'paused') {
        setQueue((q) => [...q, msg.item])
      } else if (msg.type === 'resolved') {
        setQueue((q) => q.filter((it) => it.id !== msg.id))
      } else if (msg.type === 'error') {
        setNote(msg.message)
      }
    })
    refreshTabs()
    return () => port.disconnect()
  }, [])

  useEffect(() => {
    portRef.current?.postMessage({ type: 'setConfig', enabled, filter })
  }, [enabled, filter])

  const active = useMemo(
    () => queue.find((it) => it.id === activeId) ?? null,
    [queue, activeId],
  )
  const draftIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (active) {
      if (draftIdRef.current !== active.id) {
        draftIdRef.current = active.id
        setDraft(draftOf(active))
      }
    } else {
      draftIdRef.current = null
      setDraft(null)
    }
  }, [active])

  useEffect(() => {
    if (!activeId && queue.length > 0) setActiveId(queue[0].id)
  }, [queue, activeId])

  const attach = () => {
    if (targetTab == null) return
    portRef.current?.postMessage({ type: 'attach', tabId: targetTab })
  }
  const detach = () => portRef.current?.postMessage({ type: 'detach' })

  const resolve = (action: 'forward' | 'drop') => {
    if (!active) return
    let edit: PausedEdit | undefined
    if (action === 'forward' && draft) {
      edit = {}
      if (draft.url !== active.url) edit.url = draft.url
      if (draft.method !== active.method) edit.method = draft.method
      if (active.phase === 'response') {
        const n = parseInt(draft.status, 10)
        if (Number.isFinite(n) && n !== active.status) edit.status = n
      }
      if (draft.headersText !== headersToText(active.headers)) {
        edit.headers = textToHeaders(draft.headersText)
      }
      if (!active.base64 && draft.body !== active.body) edit.body = draft.body
    }
    portRef.current?.postMessage({ type: 'resolve', id: active.id, action, edit })
    const rest = queue.filter((it) => it.id !== active.id)
    setActiveId(rest[0]?.id ?? null)
  }

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d))

  return (
    <div className="flex h-screen w-full flex-col bg-bg text-tx">
      <div className="flex flex-wrap items-center gap-2 border-b border-bd bg-panel px-3 py-2">
        <span className="text-[12px] font-medium text-tx">Interceptor</span>
        {!attached ? (
          <>
            <select
              value={targetTab ?? ''}
              onChange={(e) => setTargetTab(Number(e.target.value) || null)}
              className="h-[24px] max-w-[360px] flex-1 rounded-md border border-bd bg-bg px-1 text-[11.5px] text-tx outline-none"
            >
              <option value="">select target tab…</option>
              {tabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title || t.url}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={refreshTabs}
              className="rounded-md border border-bd px-2 py-1 text-[11px] text-mut"
            >
              refresh
            </button>
            <button
              type="button"
              onClick={attach}
              disabled={targetTab == null}
              className="rounded-md bg-acc px-3 py-1 text-[11px] font-medium text-white disabled:opacity-50"
            >
              attach
            </button>
          </>
        ) : (
          <>
            <label className="flex items-center gap-1 text-[11.5px] text-tx">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              intercept {enabled ? 'on' : 'off'}
            </label>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="url filter (regex · empty = all)"
              className="h-[24px] max-w-[320px] flex-1 rounded-md border border-bd bg-bg px-2 text-[11.5px] text-tx outline-none"
            />
            <button
              type="button"
              onClick={detach}
              className="ml-auto rounded-md bg-red px-3 py-1 text-[11px] font-medium text-white"
            >
              detach
            </button>
          </>
        )}
      </div>

      {note && (
        <div className="border-b border-bd bg-[var(--ambg)] px-3 py-1 text-[11px] text-amb">
          {note}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="w-[300px] shrink-0 overflow-auto border-r border-bd">
          {queue.length === 0 ? (
            <div className="p-3 text-[11.5px] text-mut">
              {attached
                ? enabled
                  ? 'Waiting for traffic…'
                  : 'Turn intercept on to start holding requests.'
                : 'Attach to a tab to begin. Close DevTools on that tab first.'}
            </div>
          ) : (
            queue.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setActiveId(it.id)}
                className={
                  'block w-full border-b border-bd px-2 py-1.5 text-left ' +
                  (it.id === activeId ? 'bg-[var(--sel)]' : '')
                }
              >
                <div className="flex items-center gap-1">
                  <span
                    className={
                      'font-mono text-[10px] ' +
                      (it.phase === 'request' ? 'text-sky' : 'text-grn')
                    }
                  >
                    {it.phase === 'request' ? 'REQ' : 'RES'}
                  </span>
                  <span className="font-mono text-[10px] text-mut">{it.method}</span>
                  {it.status != null && (
                    <span className="font-mono text-[10px] text-amb">{it.status}</span>
                  )}
                </div>
                <div className="truncate font-mono text-[11px] text-tx">{it.url}</div>
              </button>
            ))
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-auto p-3">
          {!active || !draft ? (
            <div className="text-[11.5px] text-mut">No item selected.</div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={
                    'font-mono text-[11px] ' +
                    (active.phase === 'request' ? 'text-sky' : 'text-grn')
                  }
                >
                  {active.phase === 'request' ? 'REQUEST' : 'RESPONSE'}
                </span>
                <button
                  type="button"
                  onClick={() => resolve('forward')}
                  className="ml-auto rounded-md bg-acc px-3 py-1 text-[11px] font-medium text-white"
                >
                  forward
                </button>
                <button
                  type="button"
                  onClick={() => resolve('drop')}
                  className="rounded-md bg-red px-3 py-1 text-[11px] font-medium text-white"
                >
                  drop
                </button>
              </div>

              <div className="flex gap-2">
                {active.phase === 'request' ? (
                  <input
                    value={draft.method}
                    onChange={(e) => set({ method: e.target.value })}
                    className="w-24 rounded-md border border-bd bg-bg px-2 py-1 font-mono text-[12px] text-tx outline-none"
                  />
                ) : (
                  <input
                    value={draft.status}
                    onChange={(e) => set({ status: e.target.value })}
                    title="status code"
                    className="w-24 rounded-md border border-bd bg-bg px-2 py-1 font-mono text-[12px] text-tx outline-none"
                  />
                )}
                <input
                  value={draft.url}
                  onChange={(e) => set({ url: e.target.value })}
                  readOnly={active.phase === 'response'}
                  className={FIELD}
                />
              </div>

              <label className="text-[10px] uppercase tracking-[0.09em] text-mut">
                headers
              </label>
              <textarea
                value={draft.headersText}
                onChange={(e) => set({ headersText: e.target.value })}
                spellCheck={false}
                rows={6}
                className={FIELD + ' resize-y'}
              />

              <label className="text-[10px] uppercase tracking-[0.09em] text-mut">
                body {active.base64 && '(binary — not editable)'}
              </label>
              <textarea
                value={draft.body}
                onChange={(e) => set({ body: e.target.value })}
                spellCheck={false}
                readOnly={active.base64}
                rows={12}
                className={FIELD + ' resize-y'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
