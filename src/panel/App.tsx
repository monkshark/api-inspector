import { useEffect } from 'react'
import { useNetworkCapture } from './hooks/useNetworkCapture'
import { useInspectorStore } from './store/useInspectorStore'
import FilterBar from './components/FilterBar'
import RequestList from './components/RequestList'
import DetailPanel from './components/DetailPanel'
import StatusBar from './components/StatusBar'
import DiffPanel from './components/DiffPanel'

function DiffBaseBanner() {
  const diffBaseId = useInspectorStore((s) => s.diffBaseId)
  const base = useInspectorStore((s) =>
    s.requests.find((r) => r.id === s.diffBaseId),
  )
  const setDiffBase = useInspectorStore((s) => s.setDiffBase)
  if (!diffBaseId || !base) return null
  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
      <span>
        diff 기준: <span className="font-mono">{base.method} {base.path}</span> —
        다른 요청을 우클릭해 "기준과 비교"를 선택하세요.
      </span>
      <button
        type="button"
        onClick={() => setDiffBase(null)}
        className="ml-auto rounded px-1.5 hover:bg-amber-200 dark:hover:bg-amber-900"
      >
        해제
      </button>
    </div>
  )
}

export default function App() {
  useNetworkCapture()
  const hydrate = useInspectorStore((s) => s.hydrate)
  const selectedId = useInspectorStore((s) => s.selectedId)
  const selected = useInspectorStore((s) =>
    s.requests.find((r) => r.id === s.selectedId),
  )
  const base = useInspectorStore((s) =>
    s.requests.find((r) => r.id === s.diffBaseId),
  )
  const compare = useInspectorStore((s) =>
    s.requests.find((r) => r.id === s.diffCompareId),
  )
  const clearDiff = useInspectorStore((s) => s.clearDiff)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <div className="flex h-full w-full flex-col bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <FilterBar />
      <DiffBaseBanner />
      <div className="flex min-h-0 flex-1">
        <RequestList />
        {selectedId && selected && <DetailPanel req={selected} />}
      </div>
      <StatusBar />
      {base && compare && (
        <DiffPanel base={base} compare={compare} onClose={clearDiff} />
      )}
    </div>
  )
}
