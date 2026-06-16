import type { Candidate, JwtParts } from './types'
import { decodeBase64, decodeBase64Url, decodeHex } from './decoders'
import { readabilityScore } from './readability'

const RE_JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/
const RE_UUID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const RE_URL = /%[0-9A-Fa-f]{2}/
const RE_DIGITS = /^[0-9]+$/
const RE_HEX = /^[0-9a-fA-F]+$/
const RE_B64 = /^[A-Za-z0-9+/]+={0,2}$/
const RE_B64URL = /^[A-Za-z0-9_-]+$/

const TS_MIN_SECONDS = 946684800
const TS_MAX_SECONDS = 4102444800
const READABLE_THRESHOLD = 0.85

function binaryConfidence(base: number, output: string): number {
  const score = readabilityScore(output)
  const readable = score >= READABLE_THRESHOLD ? score : 0
  return base + readable * 0.45
}

function oneLine(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed
}

function asJsonObject(text: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(text)
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function detectJwt(input: string): Candidate | null {
  if (!RE_JWT.test(input)) return null
  const [headerPart, payloadPart, signature = ''] = input.split('.')

  let headerText: string
  try {
    headerText = decodeBase64Url(headerPart)
  } catch {
    return null
  }
  const header = asJsonObject(headerText)
  if (!header) return null

  let payloadText = ''
  try {
    payloadText = decodeBase64Url(payloadPart)
  } catch {
    payloadText = ''
  }
  const payload = asJsonObject(payloadText)

  const parts: JwtParts = {
    header,
    payload,
    signature,
    headerText,
    payloadText,
    payloadValid: payload !== null,
  }

  if (payload) {
    return {
      format: 'jwt',
      confidence: 0.99,
      output: payloadText,
      preview: oneLine(payloadText),
      jwt: parts,
    }
  }

  return {
    format: 'jwt-invalid',
    confidence: 0.9,
    output: payloadText,
    preview: oneLine(payloadText || headerText),
    error: 'Looks like a JWT but the payload is not valid JSON.',
    jwt: parts,
  }
}

function detectUuid(input: string): Candidate | null {
  if (!RE_UUID.test(input)) return null
  const version = parseInt(input[14], 16)
  return {
    format: 'uuid',
    confidence: 0.99,
    output: input.toLowerCase(),
    preview: `UUID v${version}`,
    uuidVersion: version,
  }
}

function detectTimestamp(input: string): Candidate | null {
  if (!RE_DIGITS.test(input)) return null

  if (input.length === 10) {
    const seconds = Number(input)
    if (seconds < TS_MIN_SECONDS || seconds > TS_MAX_SECONDS) return null
    const ms = seconds * 1000
    const iso = new Date(ms).toISOString()
    return {
      format: 'unix-seconds',
      confidence: 0.9,
      output: iso,
      preview: iso,
      epochMs: ms,
    }
  }

  if (input.length === 13) {
    const ms = Number(input)
    if (ms < TS_MIN_SECONDS * 1000 || ms > TS_MAX_SECONDS * 1000) return null
    const iso = new Date(ms).toISOString()
    return {
      format: 'unix-millis',
      confidence: 0.9,
      output: iso,
      preview: iso,
      epochMs: ms,
    }
  }

  return null
}

function detectUrl(input: string): Candidate | null {
  if (!RE_URL.test(input)) return null
  let output: string
  try {
    output = decodeURIComponent(input)
  } catch {
    return {
      format: 'url',
      confidence: 0.6,
      output: input,
      preview: oneLine(input),
      error: 'Looks URL-encoded but decoding failed.',
    }
  }
  if (output === input) return null
  return {
    format: 'url',
    confidence: 0.88,
    output,
    preview: oneLine(output),
  }
}

function detectHex(input: string): Candidate | null {
  if (input.length < 2 || input.length % 2 !== 0) return null
  if (!RE_HEX.test(input)) return null
  let output: string
  try {
    output = decodeHex(input)
  } catch {
    return null
  }
  return {
    format: 'hex',
    confidence: binaryConfidence(0.5, output),
    output,
    preview: oneLine(output),
  }
}

function detectBase64(input: string): Candidate | null {
  if (input.length < 4 || input.length % 4 === 1) return null
  if (!RE_B64.test(input)) return null
  let output: string
  try {
    output = decodeBase64(input)
  } catch {
    return null
  }
  return {
    format: 'base64',
    confidence: binaryConfidence(0.45, output),
    output,
    preview: oneLine(output),
  }
}

function detectBase64Url(input: string): Candidate | null {
  if (input.length < 4 || input.length % 4 === 1) return null
  if (!RE_B64URL.test(input)) return null
  if (!input.includes('-') && !input.includes('_')) return null
  let output: string
  try {
    output = decodeBase64Url(input)
  } catch {
    return null
  }
  return {
    format: 'base64url',
    confidence: binaryConfidence(0.46, output),
    output,
    preview: oneLine(output),
  }
}

export function detect(raw: string): Candidate[] {
  const input = raw.trim()
  if (!input) return []
  const candidates = [
    detectJwt(input),
    detectUuid(input),
    detectTimestamp(input),
    detectUrl(input),
    detectHex(input),
    detectBase64Url(input),
    detectBase64(input),
  ].filter((candidate): candidate is Candidate => candidate !== null)
  candidates.sort((a, b) => b.confidence - a.confidence)
  return candidates
}
