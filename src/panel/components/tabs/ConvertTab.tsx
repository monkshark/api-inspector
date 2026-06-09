import { useState } from 'react'
import type { CapturedRequest, ConvertFormat } from '../../../types'
import { convert } from '../../../core/convert'
import { useInspectorStore } from '../../store/useInspectorStore'
import { shareOptions } from '../../share'
import { copyText } from '../../util'

const FORMATS: { key: ConvertFormat; label: string }[] = [
  { key: 'curl', label: 'cURL' },
  { key: 'httpie', label: 'HTTPie' },
]

export default function ConvertTab({ req }: { req: CapturedRequest }) {
  const maskKeys = useInspectorStore((s) => s.maskKeys)
  const safeShare = useInspectorStore((s) => s.safeShare)
  const toggleSafeShare = useInspectorStore((s) => s.toggleSafeShare)
  const [format, setFormat] = useState<ConvertFormat>('curl')
  const [copied, setCopied] = useState(false)

  const output = convert(req, format, shareOptions(safeShare, maskKeys))

  const onCopy = async () => {
    const ok = await copyText(output)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    }
  }

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex gap-1">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFormat(f.key)}
              className={
                'rounded px-2 py-0.5 text-xs font-medium ' +
                (format === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300')
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-2 flex overflow-hidden rounded border border-zinc-300 dark:border-zinc-600">
          <button
            type="button"
            onClick={() => safeShare && toggleSafeShare()}
            className={
              'px-2 py-0.5 text-xs font-medium ' +
              (!safeShare
                ? 'bg-amber-500 text-white'
                : 'bg-transparent text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700')
            }
          >
            원본
          </button>
          <button
            type="button"
            onClick={() => !safeShare && toggleSafeShare()}
            className={
              'px-2 py-0.5 text-xs font-medium ' +
              (safeShare
                ? 'bg-emerald-600 text-white'
                : 'bg-transparent text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700')
            }
          >
            안전
          </button>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="ml-auto rounded bg-emerald-600 px-3 py-0.5 text-xs font-medium text-white hover:bg-emerald-500"
        >
          {copied ? '복사됨 ✓' : 'Copy'}
        </button>
      </div>
      {safeShare ? (
        <p className="mb-1 text-[11px] text-zinc-400">
          안전 모드 — 자격증명은 변수 자리($AUTH_TOKEN), PII는 가림. 실행 전 값
          지정 필요 (예: export AUTH_TOKEN=...)
        </p>
      ) : (
        <p className="mb-1 text-[11px] text-amber-500">
          원본 모드 — 실제 토큰·쿠키가 그대로 포함됨. 공유 금지, 로컬 실행용.
        </p>
      )}
      <pre className="min-h-0 flex-1 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-2 font-mono text-xs leading-5 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
        {output}
      </pre>
    </div>
  )
}
