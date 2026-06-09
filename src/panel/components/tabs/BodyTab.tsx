import type { CapturedRequest } from '../../../types'
import { useInspectorStore } from '../../store/useInspectorStore'
import { useResponseBody } from '../../hooks/useResponseBody'
import { prettyJson } from '../../util'
import { maskText, maskDeep } from '../../../core/mask'
import JsonTree from '../JsonTree'

function RequestBodyView({ req, mask }: { req: CapturedRequest; mask: boolean }) {
  const body = req.reqBody
  if (body.kind === 'none') return <p className="text-xs text-zinc-400">요청 바디 없음</p>
  if (body.kind === 'json') {
    return body.parsed !== undefined ? (
      <JsonTree data={maskDeep(body.parsed, mask)} />
    ) : (
      <pre className="whitespace-pre-wrap break-all font-mono text-xs">
        {maskText(body.raw, mask)}
      </pre>
    )
  }
  if (body.kind === 'text') {
    return (
      <pre className="whitespace-pre-wrap break-all font-mono text-xs">
        {maskText(body.raw, mask)}
      </pre>
    )
  }
  if (body.kind === 'form') {
    return (
      <div className="space-y-0.5 font-mono text-xs">
        {body.pairs.map(([k, v], i) => (
          <div key={i}>
            <span className="text-violet-600 dark:text-violet-400">{k}</span> ={' '}
            {maskText(v, mask)}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="space-y-0.5 font-mono text-xs">
      {body.parts.map((p, i) => (
        <div key={i}>
          <span className="text-violet-600 dark:text-violet-400">{p.name}</span>
          {p.filename ? ` = @${p.filename}` : ' = (field)'}
        </div>
      ))}
    </div>
  )
}

function ResponseBodyView({ req, mask }: { req: CapturedRequest; mask: boolean }) {
  useResponseBody(req.id)
  const entry = useInspectorStore((s) => s.resBodies[req.id])

  if (!entry || entry.state === 'idle' || entry.state === 'loading') {
    return <p className="text-xs text-zinc-400">불러오는 중…</p>
  }
  if (entry.state === 'error') {
    return <p className="text-xs text-red-500">응답 본문을 가져오지 못했습니다.</p>
  }
  if (entry.state === 'binary') {
    return <p className="text-xs text-zinc-400">[binary 응답 — 미리보기 생략]</p>
  }

  const isJson = (req.resMime ?? '').includes('json')
  const text = entry.body ?? ''
  let display: string
  if (isJson) {
    try {
      display = JSON.stringify(maskDeep(JSON.parse(text), mask), null, 2)
    } catch {
      display = maskText(prettyJson(text), mask)
    }
  } else {
    display = maskText(text, mask)
  }

  return (
    <div>
      {entry.state === 'truncated' && (
        <p className="mb-1 text-[11px] text-amber-500">
          ⚠ 응답이 커서 일부만 표시합니다.
        </p>
      )}
      <pre className="whitespace-pre-wrap break-all font-mono text-xs">
        {display}
      </pre>
    </div>
  )
}

export default function BodyTab({ req }: { req: CapturedRequest }) {
  const mask = useInspectorStore((s) => s.maskEnabled)
  return (
    <div className="space-y-4 p-3">
      <div>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Request Body
        </h3>
        <RequestBodyView req={req} mask={mask} />
      </div>
      <div>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Response Body
        </h3>
        <ResponseBodyView req={req} mask={mask} />
      </div>
    </div>
  )
}
