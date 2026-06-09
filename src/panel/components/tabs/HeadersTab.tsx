import type { CapturedRequest } from '../../../types'
import { maskHeaders, isSensitiveHeader } from '../../../core/mask'
import { useInspectorStore } from '../../store/useInspectorStore'

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
      <div className="mb-3 break-all font-mono text-xs text-zinc-500">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {req.method}
        </span>{' '}
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
