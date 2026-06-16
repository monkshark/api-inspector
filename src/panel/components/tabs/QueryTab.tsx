import type { CapturedRequest } from '../../../types'
import { useInspectorStore } from '../../store/useInspectorStore'
import { isSensitiveQueryKey, maskValue, maskText } from '../../../core/mask'

export default function QueryTab({ req }: { req: CapturedRequest }) {
  const mask = useInspectorStore((s) => s.maskEnabled)

  if (req.query.length === 0) {
    return (
      <div className="p-3">
        <div className="rounded-lg border border-dashed border-bd p-3.5 text-center text-[11.5px] text-mut">
          No query parameters
        </div>
      </div>
    )
  }

  const display = (key: string, value: string): string => {
    if (!mask) return value
    return isSensitiveQueryKey(key) ? maskValue(value) : maskText(value, true)
  }

  return (
    <div className="p-3">
      <div className="overflow-hidden rounded-lg border border-bd">
        {req.query.map(([k, v], i) => (
          <div
            key={`${k}-${i}`}
            className="grid grid-cols-[10rem_1fr] gap-2.5 border-b border-bd px-[9px] py-1.5 text-[12px] last:border-0"
          >
            <span className="truncate font-medium text-mut" title={k}>
              {k}
            </span>
            <span className="break-all text-tx">{display(k, v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
