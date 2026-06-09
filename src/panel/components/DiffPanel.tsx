import { useMemo } from 'react'
import type { CapturedRequest } from '../../types'
import { diffRequests, type DiffRow, type DiffState } from '../../core/diff'

function stateClass(state: DiffState): string {
  if (state === 'added') return 'bg-emerald-50 dark:bg-emerald-950/30'
  if (state === 'removed') return 'bg-red-50 dark:bg-red-950/30'
  if (state === 'changed') return 'bg-amber-50 dark:bg-amber-950/30'
  return ''
}

function RowSection({ title, rows }: { title: string; rows: DiffRow[] }) {
  const visible = rows.filter((r) => r.state !== 'same')
  return (
    <div className="mb-3">
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {title}{' '}
        <span className="font-normal normal-case text-zinc-400">
          ({visible.length} changed / {rows.length})
        </span>
      </h3>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-400">—</p>
      ) : (
        <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
          {rows.map((r) => (
            <div
              key={r.key}
              className={
                'grid grid-cols-[8rem_1fr_1fr] gap-2 border-b border-zinc-100 px-2 py-1 text-xs last:border-0 dark:border-zinc-800 ' +
                stateClass(r.state)
              }
            >
              <span className="truncate font-mono font-medium text-zinc-500" title={r.key}>
                {r.key}
              </span>
              <span className="break-all font-mono text-zinc-700 dark:text-zinc-300">
                {r.a ?? <span className="text-zinc-300">∅</span>}
              </span>
              <span className="break-all font-mono text-zinc-700 dark:text-zinc-300">
                {r.b ?? <span className="text-zinc-300">∅</span>}
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
      <div className="flex max-h-full w-[52rem] flex-col rounded-lg bg-white shadow-xl dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
          <h2 className="text-sm font-semibold">Diff</h2>
          <span className="truncate font-mono text-[11px] text-zinc-400">
            A: {base.method} {base.path}
          </span>
          <span className="truncate font-mono text-[11px] text-zinc-400">
            B: {compare.method} {compare.path}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="mb-3 grid grid-cols-[8rem_1fr_1fr] gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            <span></span>
            <span>A</span>
            <span>B</span>
          </div>
          <RowSection title="Status" rows={[diff.status]} />
          <RowSection title="Query" rows={diff.query} />
          <RowSection title="Request Headers" rows={diff.reqHeaders} />
          <RowSection title="Response Headers" rows={diff.resHeaders} />
          <div>
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Request Body {diff.reqBody.changed ? '(changed)' : '(same)'}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <pre className="max-h-48 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950">
                {diff.reqBody.a || '∅'}
              </pre>
              <pre className="max-h-48 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950">
                {diff.reqBody.b || '∅'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
