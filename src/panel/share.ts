import type { ConvertOptions } from '../core/convert'

export function shareOptions(safeShare: boolean, maskKeys: string[]): ConvertOptions {
  return safeShare
    ? { mask: true, maskKeys, placeholders: true }
    : { mask: false, maskKeys }
}
