import { TAMPER_STORAGE_KEY, type TamperRule } from '../core/tamper'

function storage(): chrome.storage.LocalStorageArea | null {
  if (typeof chrome === 'undefined') return null
  if (!chrome.storage || !chrome.storage.local) return null
  return chrome.storage.local
}

export async function loadRules(): Promise<TamperRule[]> {
  const area = storage()
  if (!area) return []
  const stored = await area.get(TAMPER_STORAGE_KEY)
  return (stored[TAMPER_STORAGE_KEY] as TamperRule[]) ?? []
}

export async function saveRules(rules: TamperRule[]): Promise<void> {
  const area = storage()
  if (!area) return
  await area.set({ [TAMPER_STORAGE_KEY]: rules })
}

export function onRulesChanged(
  callback: (rules: TamperRule[]) => void,
): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage) return () => {}
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area !== 'local') return
    const change = changes[TAMPER_STORAGE_KEY]
    if (change) callback((change.newValue as TamperRule[]) ?? [])
  }
  chrome.storage.onChanged.addListener(handler)
  return () => chrome.storage.onChanged.removeListener(handler)
}
