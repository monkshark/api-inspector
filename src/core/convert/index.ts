import type { CapturedRequest, ConvertFormat } from '../../types'
import { toCurl } from './toCurl'
import { toHttpie } from './toHttpie'
import type { ConvertOptions } from './shell'

export type { ConvertOptions } from './shell'

export function convert(
  req: CapturedRequest,
  format: ConvertFormat,
  opts: ConvertOptions,
): string {
  switch (format) {
    case 'curl':
      return toCurl(req, opts)
    case 'httpie':
      return toHttpie(req, opts)
  }
}
