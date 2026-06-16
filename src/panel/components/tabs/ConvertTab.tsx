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
      <div className="mb-2 flex items-center gap-1.5">
        <div className="flex gap-[3px]">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFormat(f.key)}
              className={
                'flex h-[22px] items-center rounded-md px-2 text-[11px] transition ' +
                (format === f.key
                  ? 'bg-acc font-medium text-white'
                  : 'bg-[color-mix(in_srgb,var(--mut)_16%,transparent)] text-tx')
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-1 flex gap-0.5">
          <button
            type="button"
            onClick={() => safeShare && toggleSafeShare()}
            className={
              'flex h-[22px] items-center rounded-md px-2 text-[11px] ' +
              (!safeShare
                ? 'bg-amb font-medium text-white'
                : 'bg-[color-mix(in_srgb,var(--mut)_16%,transparent)] text-tx')
            }
          >
            Raw
          </button>
          <button
            type="button"
            onClick={() => !safeShare && toggleSafeShare()}
            className={
              'flex h-[22px] items-center rounded-md px-2 text-[11px] ' +
              (safeShare
                ? 'bg-grn font-medium text-white'
                : 'bg-[color-mix(in_srgb,var(--mut)_16%,transparent)] text-tx')
            }
          >
            Safe
          </button>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="ml-auto flex h-[22px] items-center rounded-md bg-grn px-3 text-[11px] font-medium text-white"
        >
          {copied ? 'copied ✓' : 'copy'}
        </button>
      </div>
      {safeShare ? (
        <p className="mb-1 text-[11px] text-mut">
          Safe mode — credentials become placeholders ($AUTH_TOKEN), PII is
          masked. Set the values before running (e.g. export AUTH_TOKEN=...).
        </p>
      ) : (
        <p className="mb-1 text-[11px] text-amb">
          Raw mode — real tokens and cookies are included as-is. Do not share;
          for local use only.
        </p>
      )}
      <pre className="min-h-0 flex-1 overflow-auto rounded-lg border border-bd bg-panel p-2.5 font-mono text-[11.5px] leading-5 text-tx">
        {output}
      </pre>
    </div>
  )
}
