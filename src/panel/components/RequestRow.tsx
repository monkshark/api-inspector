import type { CapturedRequest } from '../../types'
import { statusClass } from '../../core/filter'
import { formatBytes, formatDuration } from '../util'

function statusColor(status: number): string {
  const cls = statusClass(status)
  if (cls === '2xx') return 'text-emerald-600 dark:text-emerald-400'
  if (cls === '3xx') return 'text-sky-600 dark:text-sky-400'
  if (cls === '4xx') return 'text-amber-600 dark:text-amber-400'
  if (cls === '5xx') return 'text-red-600 dark:text-red-400'
  return 'text-zinc-400'
}

export default function RequestRow({
  req,
  selected,
  onSelect,
  onContextMenu,
}: {
  req: CapturedRequest
  selected: boolean
  onSelect: () => void
  onContextMenu: (e: React.MouseEvent) => void
}) {
  const highlight = req.status === 401 || req.status === 403

  return (
    <div
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={
        'grid cursor-default grid-cols-[3rem_1fr_3rem_4rem_4rem_4rem] items-center gap-2 border-b border-zinc-100 px-2 py-1 text-xs dark:border-zinc-800 ' +
        (selected
          ? 'bg-indigo-50 dark:bg-indigo-950/40 '
          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ') +
        (highlight && !selected ? 'bg-amber-50/60 dark:bg-amber-950/20' : '')
      }
    >
      <span className="font-mono font-semibold text-zinc-500">{req.method}</span>
      <span className="truncate font-mono text-zinc-800 dark:text-zinc-200" title={req.url}>
        {req.path}
      </span>
      <span className={'text-right font-mono ' + statusColor(req.status)}>
        {req.status || '—'}
      </span>
      <span className="truncate text-right text-zinc-400">{req.type}</span>
      <span className="text-right text-zinc-400">{formatDuration(req.durationMs)}</span>
      <span className="text-right text-zinc-400">{formatBytes(req.sizeBytes)}</span>
    </div>
  )
}
