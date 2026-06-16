import { useInspectorStore } from '../store/useInspectorStore'

export default function DiffBaseBanner() {
  const diffBaseId = useInspectorStore((s) => s.diffBaseId)
  const base = useInspectorStore((s) =>
    s.requests.find((r) => r.id === s.diffBaseId),
  )
  const setDiffBase = useInspectorStore((s) => s.setDiffBase)
  if (!diffBaseId || !base) return null
  return (
    <div className="flex items-center gap-2 border-[#e6cf8a] bg-[#fff8e6] px-3 py-[7px] text-[11.5px] text-[#9a6700] dark:border-[#4a3c14] dark:bg-[#2b2410] dark:text-[#e3b341]">
      <span>
        diff base:{' '}
        <span className="font-medium text-[#6e4a00] dark:font-normal dark:text-[#f0d68a]">
          {base.method} {base.path}
        </span>{' '}
        — right-click another request and choose "Compare with base".
      </span>
      <button
        type="button"
        onClick={() => setDiffBase(null)}
        className="ml-auto flex h-[22px] items-center rounded-md border border-[#e6cf8a] px-2.5 text-[11px] dark:border-[#6b561c]"
      >
        clear
      </button>
    </div>
  )
}
