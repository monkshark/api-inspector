import { useEffect, useRef, useState } from 'react'
import type { CapturedRequest } from '../../../types'
import { useInspectorStore } from '../../store/useInspectorStore'
import { bodyToString } from '../../../core/diff'
import { applyVars } from '../../../core/vars'
import { statusLabel } from '../../../core/status'
import { statusClass } from '../../../core/filter'
import { prettyJson } from '../../util'
import { runResend, type ResendResult } from '../../resend'
import JsonEditor from '../JsonEditor'
import JsonTree from '../JsonTree'
import AutoTextarea from '../AutoTextarea'

interface HeaderRow {
  key: string
  value: string
}

function statusColor(status: number): string {
  const cls = statusClass(status)
  if (cls === '2xx') return 'text-grn'
  if (cls === '3xx') return 'text-sky'
  if (cls === '4xx') return 'text-amb'
  if (cls === '5xx') return 'text-red'
  return 'text-mut'
}

function parseVarsText(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const k = t.slice(0, i).trim()
    if (k) out[k] = t.slice(i + 1).trim()
  }
  return out
}

function varsToText(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
}

function toRows(headers: Record<string, string>): HeaderRow[] {
  return Object.entries(headers).map(([key, value]) => ({ key, value }))
}

const FIELD =
  'rounded-md border border-bd bg-bg px-2 py-1 font-mono text-[11.5px] text-tx outline-none'
const SECTION =
  'text-[10px] uppercase tracking-[0.09em] text-mut hover:text-tx'

export default function ResendTab({ req }: { req: CapturedRequest }) {
  const variables = useInspectorStore((s) => s.variables)
  const setVariables = useInspectorStore((s) => s.setVariables)
  const origBody = useInspectorStore((s) => s.resBodies[req.id]?.body)

  const [method, setMethod] = useState(req.method)
  const [url, setUrl] = useState(req.url)
  const [rows, setRows] = useState<HeaderRow[]>(toRows(req.reqHeaders))
  const [bodyText, setBodyText] = useState(prettyJson(bodyToString(req.reqBody)))
  const [varsText, setVarsText] = useState(varsToText(variables))
  const [showVars, setShowVars] = useState(false)
  const [headersOpen, setHeadersOpen] = useState(true)
  const [bodyOpen, setBodyOpen] = useState(true)
  const [bodyView, setBodyView] = useState<'raw' | 'tree'>('raw')
  const [treeState, setTreeState] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResendResult | null>(null)
  const [respView, setRespView] = useState<'raw' | 'tree'>('raw')
  const undoRef = useRef<string[]>([])
  const redoRef = useRef<string[]>([])

  useEffect(() => {
    setMethod(req.method)
    setUrl(req.url)
    setRows(toRows(req.reqHeaders))
    setBodyText(prettyJson(bodyToString(req.reqBody)))
    setBodyView('raw')
    setResult(null)
    undoRef.current = []
    redoRef.current = []
  }, [req.id, req.method, req.url, req.reqHeaders, req.reqBody])

  const enterTree = () => {
    try {
      const v = JSON.parse(bodyText)
      if (v !== null && typeof v === 'object') {
        setTreeState(v)
        setBodyView('tree')
        return
      }
    } catch {
      void 0
    }
    window.alert('Not a valid JSON object/array, so it cannot be shown as a tree.')
  }

  const onTreeChange = (next: unknown) => {
    undoRef.current.push(bodyText)
    redoRef.current = []
    setTreeState(next)
    setBodyText(JSON.stringify(next, null, 2))
  }

  const restore = (text: string) => {
    setBodyText(text)
    try {
      setTreeState(JSON.parse(text))
    } catch {
      void 0
    }
  }

  const onTreeKeyDown = (e: React.KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return
    const z = e.key === 'z' || e.key === 'Z'
    const redo = e.key === 'y' || e.key === 'Y' || (z && e.shiftKey)
    if (z && !e.shiftKey) {
      if (undoRef.current.length === 0) return
      e.preventDefault()
      redoRef.current.push(bodyText)
      restore(undoRef.current.pop() as string)
    } else if (redo) {
      if (redoRef.current.length === 0) return
      e.preventDefault()
      undoRef.current.push(bodyText)
      restore(redoRef.current.pop() as string)
    }
  }

  const updateRow = (i: number, patch: Partial<HeaderRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const removeRow = (i: number) =>
    setRows((rs) => rs.filter((_, idx) => idx !== i))
  const addRow = () => setRows((rs) => [...rs, { key: '', value: '' }])

  const onSend = async () => {
    const v = parseVarsText(varsText)
    setVariables(v)
    const headers: Record<string, string> = {}
    for (const r of rows) {
      const k = applyVars(r.key, v).trim()
      if (k) headers[k] = applyVars(r.value, v)
    }
    setLoading(true)
    setResult(null)
    const res = await runResend({
      method,
      url: applyVars(url, v),
      headers,
      body: applyVars(bodyText, v),
    })
    setResult(res)
    setLoading(false)
  }

  const statusChanged = result && !result.error && result.status !== req.status

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <input
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          title="HTTP method"
          className={FIELD + ' w-20 uppercase'}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          title="Request URL"
          className={FIELD + ' flex-1'}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={loading}
          className="rounded-md bg-acc px-3 py-1 text-[11px] font-medium text-white disabled:opacity-50"
        >
          {loading ? 'sending…' : 'send'}
        </button>
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHeadersOpen((o) => !o)}
            className={SECTION}
          >
            <span className="inline-block w-3">{headersOpen ? '▾' : '▸'}</span>
            Headers ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setShowVars((s) => !s)}
            className="ml-auto text-[11px] text-acc hover:underline"
          >
            {showVars ? 'hide variables' : 'variables {{ }}'}
          </button>
        </div>
        {headersOpen && (
        <div className="space-y-1">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                value={row.key}
                onChange={(e) => updateRow(i, { key: e.target.value })}
                placeholder="Header"
                className={FIELD + ' w-40'}
              />
              <span className="text-mut">:</span>
              <input
                value={row.value}
                onChange={(e) => updateRow(i, { value: e.target.value })}
                placeholder="value"
                className={FIELD + ' flex-1'}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                title="Remove"
                className="rounded-md px-1.5 py-0.5 text-mut hover:bg-[var(--hov)]"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="text-[11px] text-acc hover:underline"
          >
            + add header
          </button>
        </div>
        )}
      </div>

      {showVars && (
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.09em] text-mut">
            Variables (key=value, used as {'{{key}}'})
          </div>
          <AutoTextarea
            value={varsText}
            onChange={(e) => setVarsText(e.target.value)}
            spellCheck={false}
            rows={3}
            placeholder={'AUTH_TOKEN=Bearer abc\nbase=https://api.example.com'}
            className={FIELD + ' w-full resize-none overflow-auto'}
          />
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBodyOpen((o) => !o)}
            className={SECTION}
          >
            <span className="inline-block w-3">{bodyOpen ? '▾' : '▸'}</span>
            Body
          </button>
          {bodyOpen && (
          <div className="ml-auto flex items-center gap-1">
            {bodyView === 'raw' && (
              <button
                type="button"
                onClick={() => setBodyText((b) => prettyJson(b))}
                title="Format JSON"
                className="text-[11px] text-acc hover:underline"
              >
                format
              </button>
            )}
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() => setBodyView('raw')}
                className={
                  'flex h-[22px] items-center rounded-md px-2 text-[11px] ' +
                  (bodyView === 'raw'
                    ? 'bg-acc font-medium text-white'
                    : 'bg-[color-mix(in_srgb,var(--mut)_16%,transparent)] text-tx')
                }
              >
                Raw
              </button>
              <button
                type="button"
                onClick={() => (bodyView === 'tree' ? undefined : enterTree())}
                className={
                  'flex h-[22px] items-center rounded-md px-2 text-[11px] ' +
                  (bodyView === 'tree'
                    ? 'bg-acc font-medium text-white'
                    : 'bg-[color-mix(in_srgb,var(--mut)_16%,transparent)] text-tx')
                }
              >
                Tree
              </button>
            </div>
          </div>
          )}
        </div>
        {bodyOpen &&
          (bodyView === 'raw' ? (
            <AutoTextarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              spellCheck={false}
              rows={4}
              className={FIELD + ' w-full resize-none overflow-auto'}
            />
          ) : (
            <div
              onKeyDown={onTreeKeyDown}
              className="rounded-lg border border-bd p-2"
            >
              <JsonEditor value={treeState} onChange={onTreeChange} />
            </div>
          ))}
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.09em] text-mut">
          Response
          {statusChanged && (
            <span className="rounded-md bg-[var(--ambg)] px-1.5 font-normal normal-case text-amb">
              was {statusLabel(req.status, req.statusText)} → changed
            </span>
          )}
        </div>
        {!result && (
          <p className="text-[11.5px] text-mut">
            Press send to replay using the current page session and view the
            response.
          </p>
        )}
        {result?.error && (
          <p className="text-[11.5px] text-red">Resend failed: {result.error}</p>
        )}
        {result && !result.error && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 text-[11.5px]">
              <span
                className={'font-mono font-semibold ' + statusColor(result.status)}
              >
                {statusLabel(result.status, result.statusText)}
              </span>
              <span className="text-mut">{result.ms} ms</span>
            </div>
            {(() => {
              const isJson = (result.headers['content-type'] ?? '').includes(
                'json',
              )
              let parsed: unknown
              let treeOk = false
              if (isJson) {
                try {
                  parsed = JSON.parse(result.body)
                  treeOk = parsed !== null && typeof parsed === 'object'
                } catch {
                  treeOk = false
                }
              }
              return (
                <div>
                  {treeOk && (
                    <div className="mb-1 inline-flex gap-0.5">
                      {(['raw', 'tree'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRespView(v)}
                          className={
                            'flex h-[22px] items-center rounded-md px-2 text-[10px] ' +
                            (respView === v
                              ? 'bg-acc font-medium text-white'
                              : 'bg-[color-mix(in_srgb,var(--mut)_16%,transparent)] text-tx')
                          }
                        >
                          {v === 'raw' ? 'Raw' : 'Tree'}
                        </button>
                      ))}
                    </div>
                  )}
                  {treeOk && respView === 'tree' ? (
                    <div className="max-h-64 overflow-auto rounded-lg border border-bd bg-panel p-2">
                      <JsonTree data={parsed} />
                    </div>
                  ) : (
                    <pre className="max-h-64 overflow-auto rounded-lg border border-bd bg-panel p-2 font-mono text-[11.5px] text-tx">
                      {isJson ? prettyJson(result.body) : result.body}
                    </pre>
                  )}
                </div>
              )
            })()}
            {origBody != null && origBody !== result.body && (
              <details className="text-[11.5px]">
                <summary className="cursor-pointer text-mut">
                  Original response body (differs)
                </summary>
                <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-bd bg-panel p-2 font-mono text-tx">
                  {origBody}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
