export type InterceptPhase = 'request' | 'response'

export interface HeaderEntry {
  name: string
  value: string
}

export interface PausedItem {
  id: string
  phase: InterceptPhase
  url: string
  method: string
  resourceType: string
  status?: number
  headers: HeaderEntry[]
  body: string
  base64: boolean
}

export interface PausedEdit {
  url?: string
  method?: string
  status?: number
  headers?: HeaderEntry[]
  body?: string
}

export interface TabInfo {
  id: number
  title: string
  url: string
}

export type UiToBg =
  | { type: 'attach'; tabId: number }
  | { type: 'detach' }
  | { type: 'setConfig'; enabled: boolean; filter: string }
  | { type: 'resolve'; id: string; action: 'forward' | 'drop'; edit?: PausedEdit }

export type BgToUi =
  | { type: 'attached'; tabId: number }
  | { type: 'detached'; reason: string }
  | { type: 'paused'; item: PausedItem }
  | { type: 'resolved'; id: string }
  | { type: 'error'; message: string }
