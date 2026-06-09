import { useState } from 'react'
import { useInspectorStore } from '../store/useInspectorStore'
import { applyFilter } from '../../core/filter'
import { toPostman } from '../../core/convert/toPostman'
import { toMarkdown } from '../../core/export/toMarkdown'
import { buildSession } from '../../core/session'
import { buildHar } from '../../core/har'
import { shareOptions } from '../share'
import { downloadText } from '../download'

export default function ExportMenu() {
  const [open, setOpen] = useState(false)
  const requests = useInspectorStore((s) => s.requests)
  const filter = useInspectorStore((s) => s.filter)
  const resBodies = useInspectorStore((s) => s.resBodies)
  const maskKeys = useInspectorStore((s) => s.maskKeys)
  const safeShare = useInspectorStore((s) => s.safeShare)
  const toggleSafeShare = useInspectorStore((s) => s.toggleSafeShare)

  const run = (fn: () => void) => {
    fn()
    setOpen(false)
  }

  const filtered = () => applyFilter(requests, filter, resBodies)
  const bodiesFor = (reqs: { id: string }[]) => {
    const ids = new Set(reqs.map((r) => r.id))
    return Object.fromEntries(
      Object.entries(resBodies).filter(([id]) => ids.has(id)),
    )
  }

  const items = [
    {
      label: 'Postman Collection (.json)',
      onClick: () =>
        downloadText(
          'api-inspector.postman_collection.json',
          toPostman(filtered(), shareOptions(safeShare, maskKeys)),
          'application/json',
        ),
    },
    {
      label: 'HAR (.har)',
      onClick: () => {
        const reqs = filtered()
        downloadText('api-inspector.har', buildHar(reqs, bodiesFor(reqs)), 'application/json')
      },
    },
    {
      label: 'Endpoint docs (.md)',
      onClick: () =>
        downloadText('api-endpoints.md', toMarkdown(filtered()), 'text/markdown'),
    },
    {
      label: 'Session (.json, re-importable)',
      onClick: () => {
        const reqs = filtered()
        downloadText(
          'api-inspector-session.json',
          buildSession(reqs, bodiesFor(reqs)),
          'application/json',
        )
      },
    },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={requests.length === 0}
        className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 enabled:hover:bg-zinc-300 disabled:opacity-40 dark:bg-zinc-700 dark:text-zinc-300 dark:enabled:hover:bg-zinc-600"
      >
        ⬇ export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 min-w-60 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex items-center gap-1 border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-700">
              <span className="mr-auto text-zinc-400">공유 모드</span>
              <button
                type="button"
                onClick={() => safeShare && toggleSafeShare()}
                className={
                  'rounded px-2 py-0.5 font-medium ' +
                  (!safeShare
                    ? 'bg-amber-500 text-white'
                    : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700')
                }
              >
                원본
              </button>
              <button
                type="button"
                onClick={() => !safeShare && toggleSafeShare()}
                className={
                  'rounded px-2 py-0.5 font-medium ' +
                  (safeShare
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700')
                }
              >
                안전
              </button>
            </div>
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => run(item.onClick)}
                className="block w-full px-3 py-1.5 text-left text-zinc-700 hover:bg-indigo-600 hover:text-white dark:text-zinc-200"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
