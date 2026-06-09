import type { CapturedRequest } from '../../../types'
import { useInspectorStore } from '../../store/useInspectorStore'
import { isSensitiveQueryKey, maskValue, maskText } from '../../../core/mask'

export default function QueryTab({ req }: { req: CapturedRequest }) {
  const mask = useInspectorStore((s) => s.maskEnabled)

  if (req.query.length === 0) {
    return <p className="p-3 text-xs text-zinc-400">쿼리 파라미터 없음</p>
  }

  const display = (key: string, value: string): string => {
    if (!mask) return value
    return isSensitiveQueryKey(key) ? maskValue(value) : maskText(value, true)
  }

  return (
    <div className="p-3">
      <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
        {req.query.map(([k, v], i) => (
          <div
            key={`${k}-${i}`}
            className="grid grid-cols-[10rem_1fr] gap-2 border-b border-zinc-100 px-2 py-1 text-xs last:border-0 dark:border-zinc-800"
          >
            <span className="truncate font-mono font-medium text-zinc-500" title={k}>
              {k}
            </span>
            <span className="break-all font-mono text-zinc-800 dark:text-zinc-200">
              {display(k, v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
