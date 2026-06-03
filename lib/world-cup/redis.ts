import { Redis } from '@upstash/redis'

let client: Redis | null = null

export function getRedis(): Redis {
  if (client) return client
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    throw new Error(
      'Redis not configured: set UPSTASH_REDIS_REST_URL+UPSTASH_REDIS_REST_TOKEN (Upstash console) or KV_REST_API_URL+KV_REST_API_TOKEN (Vercel Marketplace)',
    )
  }
  client = new Redis({ url, token })
  return client
}

export const WC_TTL_SECONDS = 60 * 60 * 24 * 120 // 120 days
export const UID_COOKIE_NAME = 'wc_uid'

const PRED_PREFIX = 'wc:pred:' // Hash: matchId -> choice
const CODE_PREFIX = 'wc:code:' // String: share code -> uid
const UIDCODE_PREFIX = 'wc:uidcode:' // String: uid -> share code (idempotent re-share)

export function predKey(uid: string): string {
  return `${PRED_PREFIX}${uid}`
}

export function codeKey(code: string): string {
  return `${CODE_PREFIX}${code}`
}

export function uidCodeKey(uid: string): string {
  return `${UIDCODE_PREFIX}${uid}`
}
