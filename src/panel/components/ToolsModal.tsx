import { useEffect, useMemo, useState } from 'react'
import { useInspectorStore } from '../store/useInspectorStore'
import { b64urlEncode, decodeJwt, md5, sha } from '../../core/codec'
import { findMatches } from '../../core/search'
import CopyButton from './CopyButton'
import DecodePanel from './decode/DecodePanel'

const BTN =
  'shrink-0 whitespace-nowrap self-start rounded-md border border-bd bg-bg px-2 py-0.5 text-[11px] text-mut'
const FIELD =
  'w-full rounded-md border border-bd bg-bg px-2 py-1 font-mono text-[11.5px] text-tx outline-none'

export default function ToolsModal({ onClose }: { onClose: () => void }) {
  const requests = useInspectorStore((s) => s.requests)
  const resBodies = useInspectorStore((s) => s.resBodies)

  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState({ md5: '', sha1: '', sha256: '' })
  const [scanPattern, setScanPattern] = useState('flag\\{[^}]*\\}')
  const [jwtPayloadEdit, setJwtPayloadEdit] = useState('')

  useEffect(() => {
    let cancelled = false
    setHashes((h) => ({ ...h, md5: input ? md5(input) : '' }))
    if (!input) {
      setHashes({ md5: '', sha1: '', sha256: '' })
      return
    }
    Promise.all([sha(input, 'SHA-1'), sha(input, 'SHA-256')]).then(
      ([sha1, sha256]) => {
        if (!cancelled) setHashes({ md5: md5(input), sha1, sha256 })
      },
    )
    return () => {
      cancelled = true
    }
  }, [input])

  const jwt = useMemo(() => decodeJwt(input), [input])

  useEffect(() => {
    if (jwt.valid) setJwtPayloadEdit(JSON.stringify(jwt.payload, null, 2))
  }, [input, jwt.valid, jwt.payload])

  const jwtParts = input.trim().split('.')
  let jwtToken = ''
  if (jwt.valid) {
    try {
      jwtToken = `${jwtParts[0]}.${b64urlEncode(jwtPayloadEdit)}.${jwtParts[2] ?? ''}`
    } catch {
      jwtToken = ''
    }
  }

  const scan = useMemo(() => {
    const out: { path: string; matches: string[] }[] = []
    for (const req of requests) {
      const body = resBodies[req.id]?.body
      if (!body) continue
      const ms = findMatches(body, scanPattern)
      if (ms.length) out.push({ path: req.path, matches: ms.map((m) => m.text) })
    }
    return out
  }, [requests, resBodies, scanPattern])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="flex max-h-full w-[44rem] flex-col rounded-xl border border-bd bg-bg shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 border-b border-bd px-4 py-2">
          <h2 className="text-[13px] font-semibold text-tx">Tools</h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md px-1.5 py-0.5 text-mut hover:bg-[var(--hov)]"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.09em] text-mut">
              Decode
            </div>
            <DecodePanel value={input} onChange={setInput} />
          </div>

          {jwt.valid && (
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.09em] text-mut">
                JWT editor (edit the payload to rebuild the token)
              </div>
              <div className="mb-1 font-mono text-[11px] text-mut">
                header: {JSON.stringify(jwt.header)}
              </div>
              <textarea
                value={jwtPayloadEdit}
                onChange={(e) => setJwtPayloadEdit(e.target.value)}
                spellCheck={false}
                rows={4}
                className={FIELD + ' resize-y'}
              />
              <pre className="mt-1 overflow-auto rounded-lg border border-bd bg-panel p-2 font-mono text-[11.5px] text-tx">
                {jwtToken}
              </pre>
              <div className="mt-1">
                <CopyButton text={jwtToken} className={BTN} />
              </div>
              <p className="mt-1 text-[11px] text-mut">
                Signature is unchanged — only passes on servers that do not
                verify it.
              </p>
            </div>
          )}

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.09em] text-mut">
              Hash
            </div>
            <div className="space-y-1 font-mono text-[11.5px] text-tx">
              {(['md5', 'sha1', 'sha256'] as const).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-14 text-mut">{k}</span>
                  <span className="flex-1 break-all">{hashes[k] || '—'}</span>
                  {hashes[k] && <CopyButton text={hashes[k]} className={BTN} />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.09em] text-mut">
              Scan all responses (regex)
            </div>
            <input
              value={scanPattern}
              onChange={(e) => setScanPattern(e.target.value)}
              className={FIELD}
            />
            <div className="mt-2 space-y-1 text-[11.5px]">
              {scan.length === 0 ? (
                <p className="text-mut">
                  No matches (only searches loaded response bodies)
                </p>
              ) : (
                scan.map((r, i) => (
                  <div key={i} className="rounded-lg border border-bd p-1.5">
                    <div className="truncate font-mono text-mut">{r.path}</div>
                    {r.matches.map((m, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <span className="flex-1 break-all font-mono text-grn">
                          {m}
                        </span>
                        <CopyButton text={m} className={BTN} />
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
