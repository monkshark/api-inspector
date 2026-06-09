import { useState } from 'react'

function Node({ name, value, depth }: { name?: string; value: unknown; depth: number }) {
  const [open, setOpen] = useState(depth < 2)
  const isArray = Array.isArray(value)
  const isObject = value !== null && typeof value === 'object'

  if (!isObject) {
    return (
      <div style={{ paddingLeft: depth * 12 }} className="font-mono text-xs leading-5">
        {name !== undefined && <span className="text-violet-600 dark:text-violet-400">{name}: </span>}
        <ValueLeaf value={value} />
      </div>
    )
  }

  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>)

  return (
    <div style={{ paddingLeft: depth * 12 }} className="font-mono text-xs leading-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <span className="inline-block w-3">{open ? '▾' : '▸'}</span>
        {name !== undefined && <span className="text-violet-600 dark:text-violet-400">{name}</span>}
        <span className="text-zinc-400">
          {name !== undefined ? ': ' : ''}
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>
      {open &&
        entries.map(([k, v]) => <Node key={k} name={k} value={v} depth={depth + 1} />)}
    </div>
  )
}

function ValueLeaf({ value }: { value: unknown }) {
  if (typeof value === 'string')
    return <span className="text-emerald-600 dark:text-emerald-400">"{value}"</span>
  if (typeof value === 'number')
    return <span className="text-amber-600 dark:text-amber-400">{value}</span>
  if (typeof value === 'boolean')
    return <span className="text-sky-600 dark:text-sky-400">{String(value)}</span>
  return <span className="text-zinc-400">null</span>
}

export default function JsonTree({ data }: { data: unknown }) {
  return <Node value={data} depth={0} />
}
