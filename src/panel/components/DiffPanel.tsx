import { useMemo } from 'react'
import type { CapturedRequest } from '../../types'
import { diffRequests, type DiffRow, type DiffState } from '../../core/diff'

function stateBg(state: DiffState): string | undefined {
  if (state === 'added') return 'var(--addbg)'
  if (state === 'removed') return 'var(--rembg)'
  if (state === 'changed') return 'var(--chgbg)'
  return undefined
}

function RowSection({ title, rows }: { title: string; rows: DiffRow[] }) {
  const visible = rows.filter((r) => r.state !== 'same')
  return (
    <div className="mb-3">
      <h3 className="mb-1 text-[10px] uppercase tracking-[0.09em] text-mut">
        {title}{' '}
        <span className="font-normal normal-case text-mut">
          ({visible.length} changed / {rows.length})
        </span>
      </h3>
      {rows.length === 0 ? (
        <p className="text-[11.5px] text-mut">—</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-bd">
          {rows.map((r) => (
            <div
              key={r.key}
              style={{ background: stateBg(r.state) }}
              className="grid grid-cols-[8rem_1fr_1fr] gap-2 border-b border-bd px-2 py-1 text-[11.5px] last:border-0"
            >
              <span className="truncate font-mono font-medium text-mut" title={r.key}>
                {r.key}
              </span>
              <span className="break-all font-mono text-tx">
                {r.a ?? <span className="text-mut">∅</span>}
              </span>
              <span className="break-all font-mono text-tx">
                {r.b ?? <span className="text-mut">∅</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DiffPanel({
  base,
  compare,
  onClose,
}: {
  base: CapturedRequest
  compare: CapturedRequest
  onClose: () => void
}) {
  const diff = useMemo(() => diffRequests(base, compare), [base, compare])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="flex max-h-full w-[52rem] flex-col rounded-xl border border-bd bg-bg shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 border-b border-bd px-4 py-2">
          <h2 className="text-[13px] font-semibold text-tx">Diff</h2>
          <span className="truncate font-mono text-[11px] text-mut">
            A: {base.method} {base.path}
          </span>
          <span className="truncate font-mono text-[11px] text-mut">
            B: {compare.method} {compare.path}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md px-1.5 py-0.5 text-mut hover:bg-[var(--hov)]"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="mb-3 grid grid-cols-[8rem_1fr_1fr] gap-2 text-[10px] uppercase tracking-[0.09em] text-mut">
            <span></span>
            <span>A</span>
            <span>B</span>
          </div>
          <RowSection title="Status" rows={[diff.status]} />
          <RowSection title="Query" rows={diff.query} />
          <RowSection title="Request Headers" rows={diff.reqHeaders} />
          <RowSection title="Response Headers" rows={diff.resHeaders} />
          <div>
            <h3 className="mb-1 text-[10px] uppercase tracking-[0.09em] text-mut">
              Request Body {diff.reqBody.changed ? '(changed)' : '(same)'}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <pre className="max-h-48 overflow-auto rounded-lg border border-bd bg-panel p-2 font-mono text-[11.5px] text-tx">
                {diff.reqBody.a || '∅'}
              </pre>
              <pre className="max-h-48 overflow-auto rounded-lg border border-bd bg-panel p-2 font-mono text-[11.5px] text-tx">
                {diff.reqBody.b || '∅'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
