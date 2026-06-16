import { useMemo } from 'react'
import { useInspectorStore } from '../store/useInspectorStore'
import { applyFilter } from '../../core/filter'

export default function StatusBar() {
  const requests = useInspectorStore((s) => s.requests)
  const filter = useInspectorStore((s) => s.filter)
  const resBodies = useInspectorStore((s) => s.resBodies)
  const maskEnabled = useInspectorStore((s) => s.maskEnabled)
  const paused = useInspectorStore((s) => s.paused)
  const maxEntries = useInspectorStore((s) => s.maxEntries)

  const shown = useMemo(
    () => applyFilter(requests, filter, resBodies).length,
    [requests, filter, resBodies],
  )

  return (
    <div className="flex items-center gap-2 border-t border-bd bg-panel px-3 text-[11px] text-mut" style={{ height: 26 }}>
      <span>
        {shown} / {requests.length}
      </span>
      <span>·</span>
      <span className={maskEnabled ? 'text-grn' : 'text-amb'}>
        masking {maskEnabled ? 'ON' : 'OFF'}
      </span>
      {paused && (
        <>
          <span>·</span>
          <span className="text-amb">paused</span>
        </>
      )}
      <span className="ml-auto">cap {maxEntries}</span>
    </div>
  )
}
