export interface RegisteredClaims {
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
}

export function readClaims(payload: unknown): RegisteredClaims {
  if (!payload || typeof payload !== 'object') return {}
  const source = payload as Record<string, unknown>
  const claims: RegisteredClaims = {}

  if (typeof source.iss === 'string') claims.iss = source.iss
  if (typeof source.sub === 'string') claims.sub = source.sub
  if (typeof source.jti === 'string') claims.jti = source.jti
  if (typeof source.aud === 'string') claims.aud = source.aud
  else if (
    Array.isArray(source.aud) &&
    source.aud.every((entry) => typeof entry === 'string')
  )
    claims.aud = source.aud as string[]
  if (typeof source.exp === 'number') claims.exp = source.exp
  if (typeof source.nbf === 'number') claims.nbf = source.nbf
  if (typeof source.iat === 'number') claims.iat = source.iat

  return claims
}

export interface ExpiryStatus {
  expired: boolean
  expiresAt: string
  remainingMs: number
}

export function expiryStatus(expSeconds: number, nowMs: number): ExpiryStatus {
  const expMs = expSeconds * 1000
  return {
    expired: nowMs >= expMs,
    expiresAt: new Date(expMs).toISOString(),
    remainingMs: expMs - nowMs,
  }
}
