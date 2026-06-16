import type { ReactNode } from 'react'

const TOKEN =
  /("(?:\\.|[^"\\])*"(?:\s*:)?)|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

const CLASS: Record<string, string> = {
  key: 'text-[#0550ae] dark:text-[#79c0ff]',
  str: 'text-[#0a3069] dark:text-[#7ee787]',
  num: 'text-[#953800] dark:text-[#f0b72f]',
  lit: 'text-[#6639ba] dark:text-[#d2a8ff]',
}

function pretty(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

export function JsonView({ value }: { value: string }) {
  const text = pretty(value)
  const nodes: ReactNode[] = []
  let last = 0
  let index = 0
  let match: RegExpExecArray | null
  TOKEN.lastIndex = 0

  while ((match = TOKEN.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const token = match[0]
    let kind = 'num'
    if (match[1]) kind = token.trimEnd().endsWith(':') ? 'key' : 'str'
    else if (match[2]) kind = 'lit'
    nodes.push(
      <span key={index++} className={CLASS[kind]}>
        {token}
      </span>,
    )
    last = match.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))

  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-all p-3 font-mono text-[12.5px] leading-[1.7] text-[#656d76] dark:text-[#8b949e]">
      {nodes}
    </pre>
  )
}
