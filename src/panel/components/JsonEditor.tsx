import { useState } from 'react'

const INP =
  'rounded border border-zinc-300 bg-white px-1 py-0.5 font-mono text-xs outline-none dark:border-zinc-600 dark:bg-zinc-950'
const SEL =
  'rounded border border-zinc-300 bg-white px-0.5 py-0.5 text-[10px] text-zinc-500 outline-none dark:border-zinc-600 dark:bg-zinc-950'

type JsonType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'
const TYPES: JsonType[] = ['string', 'number', 'boolean', 'null', 'object', 'array']

function isComposite(v: unknown): boolean {
  return v !== null && typeof v === 'object'
}

function typeOf(v: unknown): JsonType {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  if (typeof v === 'number') return 'number'
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'object') return 'object'
  return 'string'
}

function scalarText(v: unknown): string {
  return v === null ? 'null' : String(v)
}

function coerce(text: string): unknown {
  const t = text.trim()
  if (t === 'true') return true
  if (t === 'false') return false
  if (t === 'null') return null
  if (t !== '' && /^-?\d+(\.\d+)?$/.test(t)) return Number(t)
  return text
}

function convertTo(value: unknown, type: JsonType): unknown {
  switch (type) {
    case 'string':
      return isComposite(value) ? '' : scalarText(value)
    case 'number': {
      if (isComposite(value)) return 0
      const n = Number(scalarText(value))
      return Number.isFinite(n) ? n : value
    }
    case 'boolean':
      return value === true || scalarText(value) === 'true'
    case 'null':
      return null
    case 'object':
      return !Array.isArray(value) && isComposite(value) ? value : {}
    case 'array':
      return Array.isArray(value) ? value : []
  }
}

function summary(value: unknown): string {
  return Array.isArray(value)
    ? `[${(value as unknown[]).length}]`
    : `{${Object.keys(value as object).length}}`
}

function TypeSelect({
  value,
  onChange,
}: {
  value: unknown
  onChange: (v: unknown) => void
}) {
  return (
    <select
      value={typeOf(value)}
      onChange={(e) => onChange(convertTo(value, e.target.value as JsonType))}
      className={SEL}
      title="타입"
    >
      {TYPES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  )
}

function ScalarInput({
  value,
  onChange,
}: {
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (value === null) {
    return <span className="flex-1 font-mono text-xs text-zinc-400">null</span>
  }
  return (
    <input
      value={scalarText(value)}
      onChange={(e) => onChange(coerce(e.target.value))}
      className={INP + ' flex-1'}
    />
  )
}

function Row({
  keyName,
  onRenameKey,
  label,
  value,
  onChange,
  onRemove,
  depth,
}: {
  keyName?: string
  onRenameKey?: (k: string) => void
  label?: string
  value: unknown
  onChange: (v: unknown) => void
  onRemove: () => void
  depth: number
}) {
  const composite = isComposite(value)
  const [open, setOpen] = useState(depth < 2)

  return (
    <div>
      <div className="group flex items-center gap-1">
        {composite ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-4 shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <TypeSelect value={value} onChange={onChange} />
        {keyName !== undefined ? (
          <input
            value={keyName}
            onChange={(e) => onRenameKey?.(e.target.value)}
            className={INP + ' w-28 text-violet-600 dark:text-violet-400'}
          />
        ) : (
          <span className="w-6 text-right font-mono text-xs text-zinc-400">
            {label}
          </span>
        )}
        <span className="text-zinc-400">:</span>
        {composite ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            {summary(value)}
          </button>
        ) : (
          <ScalarInput value={value} onChange={onChange} />
        )}
        <button
          type="button"
          onClick={onRemove}
          title="삭제"
          className="ml-auto rounded px-1 text-zinc-400 opacity-0 transition hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700"
        >
          ×
        </button>
      </div>
      {composite && open && (
        <div className="ml-2 border-l border-zinc-200 pl-2 dark:border-zinc-700">
          <Node value={value} onChange={onChange} depth={depth + 1} />
        </div>
      )}
    </div>
  )
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-5 text-[11px] text-indigo-500 hover:underline"
    >
      {label}
    </button>
  )
}

function Node({
  value,
  onChange,
  depth,
}: {
  value: unknown
  onChange: (v: unknown) => void
  depth: number
}) {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-1">
        {value.map((item, i) => (
          <Row
            key={i}
            label={String(i)}
            value={item}
            onChange={(nv) => onChange(value.map((x, idx) => (idx === i ? nv : x)))}
            onRemove={() => onChange(value.filter((_, idx) => idx !== i))}
            depth={depth}
          />
        ))}
        <AddButton onClick={() => onChange([...value, ''])} label="+ 항목" />
      </div>
    )
  }
  if (isComposite(value)) {
    const obj = value as Record<string, unknown>
    const entries = Object.entries(obj)
    return (
      <div className="space-y-1">
        {entries.map(([k, v], i) => (
          <Row
            key={i}
            keyName={k}
            onRenameKey={(nk) => {
              const out: Record<string, unknown> = {}
              for (const [kk, vv] of entries) out[kk === k ? nk : kk] = vv
              onChange(out)
            }}
            value={v}
            onChange={(nv) => onChange({ ...obj, [k]: nv })}
            onRemove={() => {
              const out: Record<string, unknown> = {}
              for (const [kk, vv] of entries) if (kk !== k) out[kk] = vv
              onChange(out)
            }}
            depth={depth}
          />
        ))}
        <AddButton onClick={() => onChange({ ...obj, '': '' })} label="+ 필드" />
      </div>
    )
  }
  return null
}

export default function JsonEditor({
  value,
  onChange,
}: {
  value: unknown
  onChange: (v: unknown) => void
}) {
  return <Node value={value} onChange={onChange} depth={0} />
}
