import { useEffect } from 'react'
import { useInspectorStore } from '../store/useInspectorStore'
import { normalize, type HarEntryLike } from '../../core/normalize'
import { putRaw } from '../rawEntries'

export function useNetworkCapture(): void {
  useEffect(() => {
    const handler = (entry: chrome.devtools.network.Request) => {
      if (useInspectorStore.getState().paused) return
      const req = normalize(entry as unknown as HarEntryLike, Date.now())
      putRaw(req.id, entry)
      useInspectorStore.getState().addRequest(req)
    }

    chrome.devtools.network.onRequestFinished.addListener(handler)
    return () => chrome.devtools.network.onRequestFinished.removeListener(handler)
  }, [])
}
