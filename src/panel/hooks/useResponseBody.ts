import { useEffect } from 'react'
import { useInspectorStore } from '../store/useInspectorStore'
import { getRaw } from '../rawEntries'
import { decodeContent } from '../../core/mime'

export function useResponseBody(id: string | null): void {
  const setResBody = useInspectorStore((s) => s.setResBody)

  useEffect(() => {
    if (!id) return
    const existing = useInspectorStore.getState().resBodies[id]
    if (existing && existing.state !== 'idle') return

    const raw = getRaw(id)
    if (!raw || typeof raw.getContent !== 'function') {
      setResBody(id, { state: 'error' })
      return
    }

    setResBody(id, { state: 'loading' })
    let cancelled = false

    raw.getContent((content, encoding) => {
      if (cancelled) return
      const mime = useInspectorStore
        .getState()
        .requests.find((r) => r.id === id)?.resMime
      setResBody(id, decodeContent(content, encoding, mime))
    })

    return () => {
      cancelled = true
    }
  }, [id, setResBody])
}
