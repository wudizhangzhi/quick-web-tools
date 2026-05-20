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

export const CFG_PREFIX = 'fy:cfg:'
export const OWNER_PREFIX = 'fy:owner:'
export const STATS_PREFIX = 'fy:stats:'

export function statsKey(code: string, choice: 'yes' | 'no'): string {
  return `${STATS_PREFIX}${code}:${choice}`
}

export type StoredConfig = {
  questionText: string
  yesText: string
  noText: string
  yesEffectText: string
  yesMeme: string
  noMemes: [string, string, string]
  createdAt: number
}
