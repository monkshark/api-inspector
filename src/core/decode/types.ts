export type Format =
  | 'jwt'
  | 'jwt-invalid'
  | 'uuid'
  | 'url'
  | 'unix-seconds'
  | 'unix-millis'
  | 'hex'
  | 'base64'
  | 'base64url'

export interface JwtParts {
  header: Record<string, unknown> | null
  payload: Record<string, unknown> | null
  signature: string
  headerText: string
  payloadText: string
  payloadValid: boolean
}

export interface Candidate {
  format: Format
  confidence: number
  output: string
  preview: string
  error?: string
  jwt?: JwtParts
  epochMs?: number
  uuidVersion?: number
}
