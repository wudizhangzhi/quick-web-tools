import { Redis } from '@upstash/redis'

let client: Redis | null = null

export function getRedis(): Redis {
  if (client) return client
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured')
  }
  client = new Redis({ url, token })
  return client
}

export const CFG_PREFIX = 'fy:cfg:'
export const OWNER_PREFIX = 'fy:owner:'

export type StoredConfig = {
  yesText: string
  noText: string
  yesEffectText: string
  yesMeme: string
  noMemes: [string, string, string]
  createdAt: number
}
