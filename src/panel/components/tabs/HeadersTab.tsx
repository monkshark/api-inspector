import type { CapturedRequest } from '../../../types'
import { maskHeaders, isSensitiveHeader } from '../../../core/mask'
import { statusLabel } from '../../../core/status'
import { statusClass } from '../../../core/filter'
import { formatBytes, formatDuration } from '../../util'
import { useInspectorStore } from '../../store/useInspectorStore'

function statusColor(status: number): string {
  const cls = statusClass(status)
  if (cls === '2xx') return 'text-emerald-600 dark:text-emerald-400'
  if (cls === '3xx') return 'text-sky-600 dark:text-sky-400'
  if (cls === '4xx') return 'text-amber-600 dark:text-amber-400'
  if (cls === '5xx') return 'text-red-600 dark:text-red-400'
  return 'text-zinc-400'
}

function HeaderTable({
  title,
  headers,
  maskKeys,
}: {
  title: string
  headers: Record<string, string>
  maskKeys: string[]
}) {
  const entries = Object.entries(headers)
  return (
    <div className="mb-4">
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-xs text-zinc-400">—</p>
      ) : (
        <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
          {entries.map(([k, v]) => (
            <div
              key={k}
              className="grid grid-cols-[10rem_1fr] gap-2 border-b border-zinc-100 px-2 py-1 text-xs last:border-0 dark:border-zinc-800"
            >
              <span className="truncate font-mono font-medium text-zinc-500" title={k}>
                {k}
                {isSensitiveHeader(k, maskKeys) && (
                  <span className="ml-1 text-amber-500" title="민감 헤더">
                    🔒
                  </span>
                )}
              </span>
              <span className="break-all font-mono text-zinc-800 dark:text-zinc-200">
                {v}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HeadersTab({ req }: { req: CapturedRequest }) {
  const maskEnabled = useInspectorStore((s) => s.maskEnabled)
  const maskKeys = useInspectorStore((s) => s.maskKeys)
  const opts = { enabled: maskEnabled, maskKeys }

  return (
    <div className="p-3">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
          {req.method}
        </span>
        <span className={'font-mono font-semibold ' + statusColor(req.status)}>
          {statusLabel(req.status, req.statusText)}
        </span>
        <span className="text-zinc-400">{formatDuration(req.durationMs)}</span>
        <span className="text-zinc-400">{formatBytes(req.sizeBytes)}</span>
        {req.resMime && <span className="text-zinc-400">{req.resMime}</span>}
      </div>
      <div className="mb-3 break-all font-mono text-xs text-zinc-500">
        {req.url}
      </div>
      <HeaderTable
        title="Request Headers"
        headers={maskHeaders(req.reqHeaders, opts)}
        maskKeys={maskKeys}
      />
      <HeaderTable
        title="Response Headers"
        headers={maskHeaders(req.resHeaders, opts)}
        maskKeys={maskKeys}
      />
    </div>
  )
}
