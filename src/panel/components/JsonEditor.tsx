import { useState } from 'react'

const INP =
  'rounded-md border border-bd bg-bg px-1 py-0.5 font-mono text-[11.5px] text-tx outline-none'
const SEL =
  'rounded-md border border-bd bg-bg px-0.5 py-0.5 text-[10px] text-mut outline-none'

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
      title="Type"
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
    return <span className="flex-1 font-mono text-[11.5px] text-jlit">null</span>
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
            className="w-4 shrink-0 text-mut hover:text-tx"
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
            className={INP + ' w-28 text-jkey'}
          />
        ) : (
          <span className="w-6 text-right font-mono text-[11.5px] text-mut">
            {label}
          </span>
        )}
        <span className="text-mut">:</span>
        {composite ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-[11.5px] text-mut hover:text-tx"
          >
            {summary(value)}
          </button>
        ) : (
          <ScalarInput value={value} onChange={onChange} />
        )}
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          className="ml-auto rounded-md px-1 text-mut opacity-0 transition hover:bg-[var(--hov)] group-hover:opacity-100"
        >
          ×
        </button>
      </div>
      {composite && open && (
        <div className="ml-2 border-l border-bd pl-2">
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
      className="ml-5 text-[11px] text-acc hover:underline"
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
        <AddButton onClick={() => onChange([...value, ''])} label="+ item" />
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
        <AddButton onClick={() => onChange({ ...obj, '': '' })} label="+ field" />
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
