import { useRef, useState } from 'react'
import { useInspectorStore } from '../store/useInspectorStore'
import { isValidRegex } from '../../core/filter'
import { parseImport } from '../../core/session'
import { isDevtools } from '../env'
import ExportMenu from './ExportMenu'
import ToolsModal from './ToolsModal'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const STATUS_CLASSES = ['2xx', '3xx', '4xx', '5xx']

function Toggle({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={
        'flex h-[22px] items-center rounded-md px-2 text-[11px] transition ' +
        (active
          ? 'bg-acc font-medium text-white'
          : 'bg-[color-mix(in_srgb,var(--mut)_16%,transparent)] text-tx')
      }
    >
      {children}
    </button>
  )
}

const ACTION_BTN =
  'flex h-[22px] items-center gap-1 rounded-md border border-bd bg-bg px-2 text-[11px] text-mut'

export default function FilterBar() {
  const filter = useInspectorStore((s) => s.filter)
  const setFilter = useInspectorStore((s) => s.setFilter)
  const paused = useInspectorStore((s) => s.paused)
  const togglePaused = useInspectorStore((s) => s.togglePaused)
  const maskEnabled = useInspectorStore((s) => s.maskEnabled)
  const toggleMask = useInspectorStore((s) => s.toggleMask)
  const clear = useInspectorStore((s) => s.clear)
  const importEntries = useInspectorStore((s) => s.importEntries)
  const prefetchBodies = useInspectorStore((s) => s.prefetchBodies)

  const fileRef = useRef<HTMLInputElement>(null)
  const [showTools, setShowTools] = useState(false)
  const regexOk = isValidRegex(filter.query)

  const toggleIn = (list: string[], value: string): string[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { requests, resBodies } = parseImport(await file.text(), Date.now())
      importEntries(requests, resBodies)
    } catch (err) {
      window.alert(`Import failed: ${(err as Error).message}`)
    }
    e.target.value = ''
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-bd bg-panel px-[11px] py-[9px]">
      <input
        value={filter.query}
        onChange={(e) => setFilter({ query: e.target.value })}
        placeholder="filter (regex)"
        className={
          'h-[22px] w-[140px] rounded-md border px-2 text-[11px] outline-none ' +
          (regexOk
            ? 'border-bd bg-bg text-tx'
            : 'border-red bg-[color-mix(in_srgb,var(--red)_12%,var(--bg))] text-red')
        }
      />
      <div className="flex items-center gap-1.5">
        <input
          value={filter.bodyQuery}
          onChange={(e) => setFilter({ bodyQuery: e.target.value })}
          placeholder="body search"
          className="h-[22px] w-[110px] rounded-md border border-bd bg-bg px-2 text-[11px] text-tx outline-none"
        />
        {filter.bodyQuery && (
          <button
            type="button"
            onClick={prefetchBodies}
            title="Load all response bodies for searching"
            className="flex h-[22px] items-center rounded-md border border-acc bg-[color-mix(in_srgb,var(--acc)_16%,transparent)] px-2 text-[11px] text-tx"
          >
            load body
          </button>
        )}
      </div>
      <span className="h-4 w-px bg-bd" />
      <div className="flex gap-[3px]">
        {METHODS.map((m) => (
          <Toggle
            key={m}
            active={filter.methods.includes(m)}
            onClick={() => setFilter({ methods: toggleIn(filter.methods, m) })}
          >
            {m}
          </Toggle>
        ))}
      </div>
      <span className="h-4 w-px bg-bd" />
      <div className="flex gap-[3px]">
        {STATUS_CLASSES.map((s) => (
          <Toggle
            key={s}
            active={filter.statusClasses.includes(s)}
            onClick={() =>
              setFilter({ statusClasses: toggleIn(filter.statusClasses, s) })
            }
          >
            {s}
          </Toggle>
        ))}
      </div>
      <Toggle
        active={filter.hideStaticAssets}
        onClick={() => setFilter({ hideStaticAssets: !filter.hideStaticAssets })}
        title="Hide static assets"
      >
        no-static
      </Toggle>
      <div className="ml-auto flex items-center gap-[5px]">
        <input
          ref={fileRef}
          type="file"
          accept=".har,.json,application/json"
          onChange={onFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={ACTION_BTN}
        >
          📂 import
        </button>
        <button
          type="button"
          onClick={() => setShowTools(true)}
          title="Encoder/decoder · hash · response scan"
          className={ACTION_BTN}
        >
          🛠 tools
        </button>
        <button
          type="button"
          onClick={toggleMask}
          title="Mask sensitive headers"
          className={ACTION_BTN}
        >
          {maskEnabled ? <span className="text-grn">●</span> : '○'} mask
        </button>
        {isDevtools && (
          <button
            type="button"
            onClick={togglePaused}
            title="Pause capture"
            className={
              paused
                ? 'flex h-[22px] items-center gap-1 rounded-md border border-amb bg-[color-mix(in_srgb,var(--amb)_12%,var(--bg))] px-2 text-[11px] text-amb'
                : ACTION_BTN
            }
          >
            {paused ? '▶ resume' : '⏸ pause'}
          </button>
        )}
        <ExportMenu />
        <button type="button" onClick={clear} className={ACTION_BTN}>
          🗑 clear
        </button>
      </div>
      {showTools && <ToolsModal onClose={() => setShowTools(false)} />}
    </div>
  )
}
