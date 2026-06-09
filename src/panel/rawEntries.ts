const entries = new Map<string, chrome.devtools.network.Request>()

export function putRaw(id: string, entry: chrome.devtools.network.Request): void {
  entries.set(id, entry)
}

export function getRaw(id: string): chrome.devtools.network.Request | undefined {
  return entries.get(id)
}

export function removeRaw(id: string): void {
  entries.delete(id)
}

export function clearRaw(): void {
  entries.clear()
}
