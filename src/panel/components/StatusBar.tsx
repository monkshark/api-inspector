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
    <div className="flex items-center gap-3 border-t border-zinc-200 bg-zinc-100 px-3 py-1 text-[11px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
      <span>
        {shown} / {requests.length}건
      </span>
      <span>·</span>
      <span className={maskEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
        마스킹 {maskEnabled ? 'ON' : 'OFF'}
      </span>
      {paused && (
        <>
          <span>·</span>
          <span className="text-amber-500">일시정지</span>
        </>
      )}
      <span className="ml-auto">상한 {maxEntries}</span>
    </div>
  )
}
