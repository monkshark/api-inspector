import { useEffect, useMemo, useState } from 'react'
import { detect } from '../../../core/decode/detect'
import { readClaims, expiryStatus } from '../../../core/decode/claims'
import { relativeTime, isJson, uuidVariant } from '../../../core/decode/format'
import type { Candidate, Format } from '../../../core/decode/types'
import { JsonView } from './JsonView'

const FORMAT_LABEL: Record<Format, string> = {
  jwt: 'JWT',
  'jwt-invalid': 'JWT · Payload error',
  uuid: 'UUID',
  url: 'URL encoded',
  'unix-seconds': 'Unix timestamp · s',
  'unix-millis': 'Unix timestamp · ms',
  hex: 'Hex',
  base64: 'Base64',
  base64url: 'Base64URL',
}

const BYTE_FORMATS = new Set<Format>(['base64', 'base64url', 'hex'])

const CARD =
  'overflow-hidden rounded-lg border border-[#d0d7de] bg-[#f6f8fa] dark:border-[#30363d] dark:bg-[#161b22]'
const CARD_HEAD =
  'flex items-center justify-between gap-2 border-b border-[#d0d7de] px-3 py-2 dark:border-[#30363d]'
const LABEL =
  'text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#656d76] dark:text-[#8b949e]'
const LINK =
  'text-[11px] text-[#4f46e5] transition hover:underline dark:text-[#818cf8]'
const MUTED = 'text-[#656d76] dark:text-[#8b949e]'

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      window.setTimeout(
        () => setCopiedKey((current) => (current === key ? null : current)),
        1200,
      )
    } catch {
      void 0
    }
  }
  return { copiedKey, copy }
}

function CopyButton({
  text,
  copyKey,
  copiedKey,
  onCopy,
}: {
  text: string
  copyKey: string
  copiedKey: string | null
  onCopy: (text: string, key: string) => void
}) {
  return (
    <button onClick={() => onCopy(text, copyKey)} className={LINK}>
      {copiedKey === copyKey ? 'copied' : 'copy'}
    </button>
  )
}

function LowConfidence({ confidence }: { confidence: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9a6700]/40 px-2 py-0.5 font-mono text-[10px] text-[#9a6700] dark:border-[#d29922]/40 dark:text-[#d29922]">
      low confidence · {Math.round(confidence * 100)}
    </span>
  )
}

export default function DecodePanel({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [active, setActive] = useState(0)
  const copy = useCopy()

  const candidates = useMemo(() => detect(value), [value])
  const current = candidates[active] ?? candidates[0]
  const alternate = candidates.find((candidate) => candidate !== current)

  useEffect(() => {
    setActive(0)
  }, [value])

  return (
    <div className="flex flex-col gap-3">
      <div className={CARD}>
        <div className={CARD_HEAD}>
          <span className={LABEL}>input</span>
          <div className="flex items-center gap-3">
            <span className={`font-mono text-[11px] ${MUTED}`}>
              {value.length}
            </span>
            {value && (
              <button onClick={() => onChange('')} className={LINK}>
                clear
              </button>
            )}
          </div>
        </div>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste JWT · Base64 · URL · Hex · UUID · timestamp"
          spellCheck={false}
          rows={3}
          className="w-full resize-y bg-transparent p-3 font-mono text-[12.5px] leading-[1.6] text-[#1f2328] outline-none placeholder:text-[#8b949e] dark:text-[#e6edf3] dark:placeholder:text-[#484f58]"
        />
      </div>

      {value.trim() && candidates.length === 0 && (
        <p className={`${CARD} p-3 text-[12.5px] ${MUTED}`}>
          No known format detected.
        </p>
      )}

      {candidates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {candidates.map((candidate, index) => (
            <button
              key={`${candidate.format}-${index}`}
              onClick={() => setActive(index)}
              className={
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition ' +
                (index === active
                  ? 'bg-[#4f46e5] text-white dark:bg-[#6366f1]'
                  : 'border border-[#d0d7de] text-[#656d76] hover:border-[#4f46e5]/60 dark:border-[#30363d] dark:text-[#8b949e] dark:hover:border-[#6366f1]/60')
              }
            >
              {FORMAT_LABEL[candidate.format]}
              <span className="font-mono text-[10.5px] opacity-80">
                {Math.round(candidate.confidence * 100)}
              </span>
            </button>
          ))}
        </div>
      )}

      {current && (
        <Result
          candidate={current}
          copy={copy}
          altLabel={alternate ? FORMAT_LABEL[alternate.format] : undefined}
        />
      )}
    </div>
  )
}

function Result({
  candidate,
  copy,
  altLabel,
}: {
  candidate: Candidate
  copy: ReturnType<typeof useCopy>
  altLabel?: string
}) {
  if (candidate.jwt) return <JwtView candidate={candidate} copy={copy} />
  if (candidate.epochMs != null)
    return <TimestampView candidate={candidate} copy={copy} />
  if (candidate.format === 'uuid')
    return <UuidView candidate={candidate} copy={copy} />
  return <GenericView candidate={candidate} copy={copy} altLabel={altLabel} />
}

function Panel({
  title,
  text,
  copy,
  copyKey,
  badge,
  children,
}: {
  title: string
  text: string
  copy: ReturnType<typeof useCopy>
  copyKey: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className={CARD}>
      <div className={CARD_HEAD}>
        <span className={LABEL}>{title}</span>
        <div className="flex items-center gap-2.5">
          {badge}
          <CopyButton
            text={text}
            copyKey={copyKey}
            copiedKey={copy.copiedKey}
            onCopy={copy.copy}
          />
        </div>
      </div>
      {children}
    </section>
  )
}

function GenericView({
  candidate,
  copy,
  altLabel,
}: {
  candidate: Candidate
  copy: ReturnType<typeof useCopy>
  altLabel?: string
}) {
  const lowConfidence = candidate.confidence < 0.6
  const showBytes = BYTE_FORMATS.has(candidate.format)

  return (
    <Panel
      title={FORMAT_LABEL[candidate.format]}
      text={candidate.output}
      copy={copy}
      copyKey="generic"
      badge={
        lowConfidence ? (
          <LowConfidence confidence={candidate.confidence} />
        ) : undefined
      }
    >
      {candidate.error && (
        <p className="px-3 pt-3 text-[12px] text-[#9a6700] dark:text-[#d29922]">
          {candidate.error}
        </p>
      )}
      {isJson(candidate.output) ? (
        <JsonView value={candidate.output} />
      ) : (
        <div className="p-3">
          <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[13px] leading-relaxed text-[#1f2328] dark:text-[#e6edf3]">
            {candidate.output}
          </pre>
          {showBytes && (
            <p className={`mt-2.5 font-mono text-[11px] ${MUTED}`}>
              utf-8 · {byteLength(candidate.output)} bytes
            </p>
          )}
          {lowConfidence && altLabel && (
            <p className="mt-2.5 text-[11px] leading-relaxed text-[#9a6700] dark:text-[#d29922]">
              Also valid {altLabel} — confirm the source format.
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}

function UuidView({
  candidate,
  copy,
}: {
  candidate: Candidate
  copy: ReturnType<typeof useCopy>
}) {
  return (
    <Panel title="UUID" text={candidate.output} copy={copy} copyKey="uuid">
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 p-3 text-[12.5px]">
        <Row term="value">
          <span className="font-mono">{candidate.output}</span>
        </Row>
        <Row term="version">
          <span className="font-mono">{candidate.uuidVersion}</span>
        </Row>
        <Row term="variant">
          <span className="font-mono">{uuidVariant(candidate.output)}</span>
        </Row>
      </dl>
    </Panel>
  )
}

function TimestampView({
  candidate,
  copy,
}: {
  candidate: Candidate
  copy: ReturnType<typeof useCopy>
}) {
  const ms = candidate.epochMs!
  const now = Date.now()
  const local = new Date(ms).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  })
  return (
    <Panel title="Timestamp" text={candidate.output} copy={copy} copyKey="ts">
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2.5 p-3 text-[12.5px]">
        <Row term="utc">
          <span className="font-mono break-all">
            {new Date(ms).toISOString()}
          </span>
        </Row>
        <Row term="local">
          <span className="font-mono">{local}</span>
        </Row>
        <Row term="relative">
          <span className="font-mono">{relativeTime(ms, now)}</span>
        </Row>
        <Row term="epoch">
          <span className="font-mono">{Math.floor(ms / 1000)}</span>
        </Row>
      </dl>
    </Panel>
  )
}

function JwtView({
  candidate,
  copy,
}: {
  candidate: Candidate
  copy: ReturnType<typeof useCopy>
}) {
  const jwt = candidate.jwt!
  const claims = jwt.payload ? readClaims(jwt.payload) : {}
  const now = Date.now()

  return (
    <div className="flex flex-col gap-3">
      {jwt.payloadValid ? (
        <>
          {claims.exp != null && (
            <ExpiryGauge exp={claims.exp} iat={claims.iat} now={now} />
          )}
          {hasClaims(claims) && (
            <ClaimsTable claims={claims} now={now} copy={copy} />
          )}
          <Panel title="header" text={jwt.headerText} copy={copy} copyKey="jwt-h">
            <JsonView value={jwt.headerText} />
          </Panel>
          <Panel
            title="payload"
            text={jwt.payloadText}
            copy={copy}
            copyKey="jwt-p"
          >
            <JsonView value={jwt.payloadText} />
          </Panel>
        </>
      ) : (
        <>
          <Panel title="header" text={jwt.headerText} copy={copy} copyKey="jwt-h">
            <JsonView value={jwt.headerText} />
          </Panel>
          <div className="rounded-lg border border-[#d29922]/40 bg-[#d29922]/10 p-3 text-[12px] text-[#9a6700] dark:text-[#d29922]">
            {candidate.error}
            {jwt.payloadText && (
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                {jwt.payloadText}
              </pre>
            )}
          </div>
        </>
      )}

      <Panel title="signature" text={jwt.signature} copy={copy} copyKey="jwt-s">
        <div className="p-3">
          <div className="break-all font-mono text-[12px] leading-relaxed text-[#656d76] dark:text-[#8b949e]">
            {jwt.signature || '—'}
          </div>
          <p className="mt-2.5 text-[11px] italic text-[#656d76] dark:text-[#8b949e]">
            not verified — the secret never leaves this machine.
          </p>
        </div>
      </Panel>
    </div>
  )
}

function ExpiryGauge({
  exp,
  iat,
  now,
}: {
  exp: number
  iat?: number
  now: number
}) {
  const status = expiryStatus(exp, now)
  const start = (iat ?? exp - 3600) * 1000
  const end = exp * 1000
  const ratio = Math.min(1, Math.max(0, (now - start) / (end - start || 1)))
  const relative = relativeTime(end, now)

  return (
    <div className={`${CARD} p-3.5`}>
      <div className="mb-2.5 flex items-center justify-between">
        <span
          className={
            'font-mono text-[13px] font-bold tracking-[0.05em] ' +
            (status.expired
              ? 'text-[#cf222e] dark:text-[#f85149]'
              : 'text-[#1a7f37] dark:text-[#3fb950]')
          }
        >
          {status.expired ? 'EXPIRED' : 'VALID'}
        </span>
        <span className={`text-[11px] ${MUTED}`}>
          {status.expired ? `expired ${relative}` : `expires ${relative}`}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[#d0d7de] dark:bg-[#30363d]">
        <div
          className={
            'h-full rounded-full ' +
            (status.expired
              ? 'bg-[#cf222e] dark:bg-[#f85149]'
              : 'bg-[#1a7f37] dark:bg-[#3fb950]')
          }
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <p className={`mt-2.5 font-mono text-[11px] ${MUTED}`}>
        exp {status.expiresAt}
      </p>
    </div>
  )
}

function ClaimsTable({
  claims,
  now,
  copy,
}: {
  claims: ReturnType<typeof readClaims>
  now: number
  copy: ReturnType<typeof useCopy>
}) {
  const rows: Array<[string, React.ReactNode]> = []
  if (claims.iss) rows.push(['iss', claims.iss])
  if (claims.sub) rows.push(['sub', claims.sub])
  if (claims.aud)
    rows.push([
      'aud',
      Array.isArray(claims.aud) ? claims.aud.join(', ') : claims.aud,
    ])
  if (claims.jti) rows.push(['jti', claims.jti])
  for (const [key, value] of [
    ['iat', claims.iat],
    ['nbf', claims.nbf],
    ['exp', claims.exp],
  ] as const) {
    if (value != null) {
      rows.push([
        key,
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <span>{new Date(value * 1000).toISOString()}</span>
          <span className={`text-[11px] ${MUTED}`}>
            {relativeTime(value * 1000, now)}
          </span>
        </span>,
      ])
    }
  }
  if (rows.length === 0) return null

  const text = JSON.stringify(claims, null, 2)

  return (
    <section className={CARD}>
      <div className={CARD_HEAD}>
        <span className={LABEL}>claims</span>
        <CopyButton
          text={text}
          copyKey="claims"
          copiedKey={copy.copiedKey}
          onCopy={copy.copy}
        />
      </div>
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 p-3 text-[12.5px]">
        {rows.map(([term, value]) => (
          <Row key={term} term={term} mono>
            {value}
          </Row>
        ))}
      </dl>
    </section>
  )
}

function Row({
  term,
  mono,
  children,
}: {
  term: string
  mono?: boolean
  children: React.ReactNode
}) {
  return (
    <>
      <dt className="font-mono text-[12.5px] text-[#4f46e5] dark:text-[#818cf8]">
        {term}
      </dt>
      <dd
        className={
          'min-w-0 break-words ' +
          (mono ? 'font-mono text-[#1f2328] dark:text-[#e6edf3]' : '')
        }
      >
        {children}
      </dd>
    </>
  )
}

function hasClaims(claims: ReturnType<typeof readClaims>): boolean {
  return Object.keys(claims).length > 0
}
