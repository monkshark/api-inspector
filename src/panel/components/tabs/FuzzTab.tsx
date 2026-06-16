import { useEffect, useMemo, useRef, useState } from 'react'
import type { CapturedRequest } from '../../../types'
import { bodyToString } from '../../../core/diff'
import { parsePayloads, hasMarker, FUZZ_MARKER } from '../../../core/fuzz'
import { statusLabel } from '../../../core/status'
import { statusClass } from '../../../core/filter'
import { copyText } from '../../util'
import { runFuzz } from '../../resend'

interface FuzzRow {
  payload: string
  status: number
  statusText: string
  length: number
  ms: number
  body: string
  error?: string
}

const FIELD =
  'w-full rounded-md border border-bd bg-bg px-2 py-1 font-mono text-[11.5px] text-tx outline-none'

const RENDER_CAP = 1000
const BODY_BUDGET = 8_000_000

function statusColor(status: number): string {
  const cls = statusClass(status)
  if (cls === '2xx') return 'text-grn'
  if (cls === '3xx') return 'text-sky'
  if (cls === '4xx') return 'text-amb'
  if (cls === '5xx') return 'text-red'
  return 'text-mut'
}

function commonLength(rows: FuzzRow[]): number | null {
  const counts = new Map<number, number>()
  for (const r of rows) {
    if (r.error) continue
    counts.set(r.length, (counts.get(r.length) ?? 0) + 1)
  }
  let best: number | null = null
  let max = 0
  for (const [len, c] of counts) {
    if (c > max) {
      max = c
      best = len
    }
  }
  return best
}

function snippet(body: string, rx: RegExp): string | null {
  const m = body.match(rx)
  if (!m) return null
  const at = m.index ?? 0
  const start = Math.max(0, at - 24)
  const end = Math.min(body.length, at + m[0].length + 24)
  return (start > 0 ? '…' : '') + body.slice(start, end) + (end < body.length ? '…' : '')
}

export default function FuzzTab({ req }: { req: CapturedRequest }) {
  const [target, setTarget] = useState<'url' | 'body'>('url')
  const [template, setTemplate] = useState(req.url)
  const [payloadsText, setPayloadsText] = useState('')
  const [concurrency, setConcurrency] = useState(20)
  const [rows, setRows] = useState<FuzzRow[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [stopWhen, setStopWhen] = useState('')
  const [bodiesDropped, setBodiesDropped] = useState(false)
  const stopRef = useRef(false)
  const bodyCharsRef = useRef(0)

  useEffect(() => {
    setTemplate(target === 'url' ? req.url : bodyToString(req.reqBody))
    setRows([])
    setSearch('')
  }, [req.id, target, req.url, req.reqBody])

  const run = async () => {
    if (!hasMarker(template)) {
      window.alert('Insert ${} where the payload should go.')
      return
    }
    const payloads = parsePayloads(payloadsText)
    if (payloads.length === 0) return
    stopRef.current = false
    bodyCharsRef.current = 0
    setBodiesDropped(false)
    setRunning(true)
    setRows([])
    setTotal(payloads.length)
    setProgress(0)
    const conc = Math.max(1, Math.min(concurrency, 100))
    const stopTerms = stopWhen
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const acc: FuzzRow[] = []
    await runFuzz(
      {
        method: req.method,
        headers: req.reqHeaders,
        template,
        marker: FUZZ_MARKER,
        payloads,
        inUrl: target === 'url',
        baseUrl: req.url,
        baseBody: bodyToString(req.reqBody),
        concurrency: conc,
      },
      (recs) => {
        for (const r of recs) {
          const full = r.body ?? ''
          let stored = full
          if (bodyCharsRef.current + full.length > BODY_BUDGET) {
            stored = ''
            setBodiesDropped(true)
          } else {
            bodyCharsRef.current += full.length
          }
          acc.push({
            payload: payloads[r.i] ?? '',
            status: r.status,
            statusText: r.statusText,
            length: full.length,
            ms: r.ms,
            body: stored,
            error: r.error,
          })
        }
        setRows([...acc])
        setProgress(acc.length)
        if (stopTerms.length > 0) {
          for (const r of recs) {
            if (!r.body) continue
            const lower = r.body.toLowerCase()
            if (stopTerms.some((t) => lower.includes(t))) {
              stopRef.current = true
              break
            }
          }
        }
      },
      () => stopRef.current,
    )
    setRunning(false)
  }

  const stop = () => {
    stopRef.current = true
  }

  const common = commonLength(rows)

  const matcher = useMemo(() => {
    const raw = search.trim()
    if (!raw) return null
    const negate = raw.startsWith('!')
    const pat = negate ? raw.slice(1).trim() : raw
    if (!pat) return null
    try {
      return { rx: new RegExp(pat, 'i'), negate }
    } catch {
      return null
    }
  }, [search])

  const shown = useMemo(() => {
    const out: { r: FuzzRow; i: number; match: string | null }[] = []
    for (let i = 0; i < rows.length && out.length < RENDER_CAP; i++) {
      const r = rows[i]
      if (!matcher) {
        out.push({ r, i, match: null })
      } else if (matcher.negate) {
        if (!(r.body && matcher.rx.test(r.body))) out.push({ r, i, match: null })
      } else {
        if (!r.body) continue
        const m = snippet(r.body, matcher.rx)
        if (m !== null) out.push({ r, i, match: m })
      }
    }
    return out
  }, [rows, matcher])

  const truncated = shown.length >= RENDER_CAP && rows.length > RENDER_CAP

  const searchPat = (() => {
    const raw = search.trim()
    return raw.startsWith('!') ? raw.slice(1).trim() : raw
  })()
  const invalidRx = searchPat.length > 0 && matcher === null

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-[11px] text-amb">
        Use only on authorized wargame/CTF targets. Requests run in parallel
        using the current page session.
      </p>

      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {(['url', 'body'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTarget(t)}
              className={
                'flex h-[22px] items-center rounded-md px-2 text-[11px] ' +
                (target === t
                  ? 'bg-acc font-medium text-white'
                  : 'bg-[color-mix(in_srgb,var(--mut)_16%,transparent)] text-tx')
              }
            >
              {t === 'url' ? 'URL' : 'Body'}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-mut">
          {req.method} · {FUZZ_MARKER} marks the payload slot
        </span>
        <label className="ml-auto flex items-center gap-1 text-[11px] text-mut">
          parallel
          <input
            type="number"
            min={1}
            max={100}
            value={concurrency}
            onChange={(e) =>
              setConcurrency(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
            }
            title="Number of concurrent requests (browser caps per-host connections)"
            className="h-[22px] w-12 rounded-md border border-bd bg-bg px-1 text-[11px] text-tx outline-none"
          />
        </label>
        {running ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-md bg-red px-3 py-1 text-[11px] font-medium text-white"
          >
            stop {progress}/{total}
          </button>
        ) : (
          <button
            type="button"
            onClick={run}
            className="rounded-md bg-acc px-3 py-1 text-[11px] font-medium text-white"
          >
            run
          </button>
        )}
      </div>

      <label className="flex items-center gap-2 text-[11px] text-mut">
        <span className="whitespace-nowrap">stop when response matches</span>
        <input
          value={stopWhen}
          onChange={(e) => setStopWhen(e.target.value)}
          placeholder="words, comma-separated (empty = run all)"
          title="Stop as soon as a response body contains any of these comma-separated words"
          className="h-[22px] flex-1 rounded-md border border-bd bg-bg px-2 font-mono text-[11px] text-tx outline-none"
        />
      </label>

      <textarea
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        spellCheck={false}
        rows={3}
        className={FIELD + ' resize-y'}
      />

      <div>
        <div className="mb-1 text-[10px] uppercase tracking-[0.09em] text-mut">
          Payloads (one per line · range 1..100 · step 1..100..5)
        </div>
        <textarea
          value={payloadsText}
          onChange={(e) => setPayloadsText(e.target.value)}
          spellCheck={false}
          rows={4}
          placeholder={'1..100\nadmin\ntest'}
          className={FIELD + ' resize-y'}
        />
      </div>

      {rows.length > 0 && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.09em] text-mut">
              Results ({rows.length}
              {truncated ? ` · showing first ${RENDER_CAP}` : ''}) — rows with a
              different length are candidates
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search bodies (regex · !x = not x)"
              title="Search response bodies. Prefix with ! to match bodies that do NOT contain the pattern."
              className={
                'ml-auto h-[22px] w-[180px] rounded-md border bg-bg px-2 text-[11px] outline-none ' +
                (invalidRx ? 'border-red text-red' : 'border-bd text-tx')
              }
            />
          </div>
          {bodiesDropped && (
            <div className="mb-1 text-[10px] text-amb">
              Memory cap reached — later response bodies are not kept (status and
              length still recorded; search covers stored bodies only).
            </div>
          )}
          <div className="overflow-auto rounded-lg border border-bd">
            <div className="grid grid-cols-[1fr_5rem_4rem_4rem] gap-1 border-b border-bd bg-panel px-2 py-1 text-[10px] uppercase text-mut">
              <span>payload</span>
              <span>status</span>
              <span className="text-right">len</span>
              <span className="text-right">ms</span>
            </div>
            {shown.length === 0 ? (
              <div className="px-2 py-2 text-[11.5px] text-mut">
                No response bodies match.
              </div>
            ) : (
              shown.map(({ r, i, match }) => {
                const outlier =
                  !r.error && common !== null && r.length !== common
                return (
                  <div
                    key={i}
                    onClick={() => void copyText(r.payload)}
                    style={outlier ? { background: 'var(--ambg)' } : undefined}
                    className="grid cursor-pointer grid-cols-[1fr_5rem_4rem_4rem] gap-1 border-b border-bd px-2 py-1 text-[11.5px] last:border-0"
                    title="Click to copy payload"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-tx">
                        {r.payload}
                      </span>
                      {match !== null && (
                        <span className="block truncate font-mono text-[10.5px] text-grn">
                          {match}
                        </span>
                      )}
                    </span>
                    <span className={'font-mono ' + statusColor(r.status)}>
                      {r.error ? 'ERR' : statusLabel(r.status, r.statusText)}
                    </span>
                    <span className="text-right font-mono text-mut">
                      {r.error ? '—' : r.length}
                    </span>
                    <span className="text-right font-mono text-mut">{r.ms}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
