import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CapturedRequest, ResBodyEntry } from '../types'

interface StoredResBody extends ResBodyEntry {
  id: string
}

interface InspectorDB extends DBSchema {
  requests: { key: string; value: CapturedRequest }
  resBodies: { key: string; value: StoredResBody }
}

let dbPromise: Promise<IDBPDatabase<InspectorDB>> | null = null

function db(): Promise<IDBPDatabase<InspectorDB>> {
  if (!dbPromise) {
    dbPromise = openDB<InspectorDB>('api-inspector', 1, {
      upgrade(d) {
        d.createObjectStore('requests', { keyPath: 'id' })
        d.createObjectStore('resBodies', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function persistRequest(req: CapturedRequest): Promise<void> {
  try {
    await (await db()).put('requests', req)
  } catch {
    void 0
  }
}

export async function deleteRequest(id: string): Promise<void> {
  try {
    const d = await db()
    await d.delete('requests', id)
    await d.delete('resBodies', id)
  } catch {
    void 0
  }
}

export async function persistResBody(
  id: string,
  entry: ResBodyEntry,
): Promise<void> {
  try {
    await (await db()).put('resBodies', { ...entry, id })
  } catch {
    void 0
  }
}

export async function loadAll(): Promise<{
  requests: CapturedRequest[]
  resBodies: Record<string, ResBodyEntry>
}> {
  try {
    const d = await db()
    const requests = await d.getAll('requests')
    const bodies = await d.getAll('resBodies')
    const resBodies: Record<string, ResBodyEntry> = {}
    for (const stored of bodies) {
      const { id, ...rest } = stored
      resBodies[id] = rest
    }
    requests.sort((a, b) => a.startedAt - b.startedAt)
    return { requests, resBodies }
  } catch {
    return { requests: [], resBodies: {} }
  }
}

export async function clearAll(): Promise<void> {
  try {
    const d = await db()
    await d.clear('requests')
    await d.clear('resBodies')
  } catch {
    void 0
  }
}
