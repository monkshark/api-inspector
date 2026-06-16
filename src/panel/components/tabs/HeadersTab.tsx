import type { CapturedRequest } from '../../../types'
import { maskHeaders, isSensitiveHeader } from '../../../core/mask'
import { statusLabel } from '../../../core/status'
import { statusClass } from '../../../core/filter'
import { formatBytes, formatDuration } from '../../util'
import { useInspectorStore } from '../../store/useInspectorStore'

function statusColor(status: number): string {
  const cls = statusClass(status)
  if (cls === '2xx') return 'text-grn'
  if (cls === '3xx') return 'text-sky'
  if (cls === '4xx') return 'text-amb'
  if (cls === '5xx') return 'text-red'
  return 'text-mut'
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
    <div className="flex flex-col gap-[7px]">
      <h3 className="text-[10px] uppercase tracking-[0.09em] text-mut">
        {title}
      </h3>
      {entries.length === 0 ? (
        <div className="rounded-lg border border-bd px-[9px] py-1.5 text-[11.5px] text-mut">
          —
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-bd">
          {entries.map(([k, v]) => (
            <div
              key={k}
              className="grid grid-cols-[10rem_1fr] gap-2.5 border-b border-bd px-[9px] py-[5px] text-[11.5px] last:border-0"
            >
              <span className="truncate font-medium text-mut" title={k}>
                {k}
                {isSensitiveHeader(k, maskKeys) && (
                  <span className="ml-1" title="sensitive">
                    🔒
                  </span>
                )}
              </span>
              <span className="break-all text-tx">{v}</span>
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
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-x-[9px] gap-y-1 text-[12px]">
        <span className="font-bold text-tx">{req.method}</span>
        <span className={statusColor(req.status)}>
          {statusLabel(req.status, req.statusText)}
        </span>
        <span className="text-mut">{formatDuration(req.durationMs)}</span>
        <span className="text-mut">{formatBytes(req.sizeBytes)}</span>
        {req.resMime && <span className="text-mut">{req.resMime}</span>}
      </div>
      <div className="break-all text-[11.5px] leading-relaxed text-mut">
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
