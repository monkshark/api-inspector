import { useInspectorStore } from '../store/useInspectorStore'

export default function DiffBaseBanner() {
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
