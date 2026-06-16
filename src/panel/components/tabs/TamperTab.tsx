import { useEffect, useState } from 'react'
import type { CapturedRequest } from '../../../types'
import { makeRule, type TamperRule, type TamperBodyMode } from '../../../core/tamper'
import { loadRules, saveRules } from '../../tamper'

const FIELD =
  'w-full rounded-md border border-bd bg-bg px-2 py-1 font-mono text-[11.5px] text-tx outline-none'

export default function TamperTab({ req }: { req: CapturedRequest }) {
  const [rules, setRules] = useState<TamperRule[]>([])

  useEffect(() => {
    void loadRules().then(setRules)
  }, [])

  const persist = (next: TamperRule[]) => {
    setRules(next)
    void saveRules(next)
  }

  const add = () => {
    persist([...rules, makeRule(req.url, req.method)])
  }

  const update = (id: string, patch: Partial<TamperRule>) => {
    persist(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const remove = (id: string) => {
    persist(rules.filter((r) => r.id !== id))
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-[11px] text-amb">
        Rewrites responses your pages receive via fetch/XHR. Rules apply to every
        tab while enabled. Use only on targets you are authorized to test.
      </p>

      <button
        type="button"
        onClick={add}
        className="self-start rounded-md bg-acc px-3 py-1 text-[11px] font-medium text-white"
      >
        + add rule from this request
      </button>

      {rules.length === 0 ? (
        <div className="text-[11.5px] text-mut">No rules yet.</div>
      ) : (
        rules.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-2 rounded-lg border border-bd bg-panel p-2"
          >
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] text-tx">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => update(r.id, { enabled: e.target.checked })}
                />
                enabled
              </label>
              <div className="ml-auto flex gap-0.5">
                {(['replace', 'merge'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update(r.id, { bodyMode: m as TamperBodyMode })}
                    className={
                      'flex h-[22px] items-center rounded-md px-2 text-[11px] ' +
                      (r.bodyMode === m
                        ? 'bg-acc font-medium text-white'
                        : 'bg-[color-mix(in_srgb,var(--mut)_16%,transparent)] text-tx')
                    }
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => remove(r.id)}
                title="Remove rule"
                className="px-1 text-[13px] text-mut"
              >
                ✕
              </button>
            </div>

            <label className="text-[10px] uppercase tracking-[0.09em] text-mut">
              url pattern (regex)
            </label>
            <input
              value={r.urlPattern}
              onChange={(e) => update(r.id, { urlPattern: e.target.value })}
              spellCheck={false}
              className={FIELD}
            />

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-[10px] uppercase tracking-[0.09em] text-mut">
                methods (comma · empty = any)
                <input
                  value={r.methods.join(', ')}
                  onChange={(e) =>
                    update(r.id, {
                      methods: e.target.value
                        .split(/[,\s]+/)
                        .map((s) => s.trim().toUpperCase())
                        .filter(Boolean),
                    })
                  }
                  spellCheck={false}
                  placeholder="GET, POST"
                  className={FIELD}
                />
              </label>
              <label className="flex w-28 flex-col gap-1 text-[10px] uppercase tracking-[0.09em] text-mut">
                status override
                <input
                  value={r.statusOverride ?? ''}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    update(r.id, {
                      statusOverride: Number.isFinite(n) ? n : null,
                    })
                  }}
                  spellCheck={false}
                  placeholder="(keep)"
                  className={FIELD}
                />
              </label>
            </div>

            <label className="text-[10px] uppercase tracking-[0.09em] text-mut">
              {r.bodyMode === 'merge'
                ? 'json to deep-merge into the response'
                : 'replacement response body'}
            </label>
            <textarea
              value={r.body}
              onChange={(e) => update(r.id, { body: e.target.value })}
              spellCheck={false}
              rows={4}
              placeholder={r.bodyMode === 'merge' ? '{"role":"admin"}' : '{"ok":true}'}
              className={FIELD + ' resize-y'}
            />
          </div>
        ))
      )}
    </div>
  )
}
