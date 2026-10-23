// Server-side storage for shared papers (Upstash Redis, same instance as force-yes).
//
// Dev only: if Redis is missing or unreachable, fall back to an in-process Map so
// the share flow can still be tried locally (data is lost on restart). Production
// always uses Redis and surfaces its errors.
import { getRedis } from '@/lib/force-yes/redis'
import type { PaperConfig } from './config'

export const PAPER_PREFIX = 'pd:paper:'
export const PAPER_TTL_SECONDS = 60 * 60 * 24 * 90 // 90 days

export type Decision = 'approved' | 'rejected'

export type StoredPaper = {
  cfg: PaperConfig
  createdAt: number
  decision?: Decision
  decidedAt?: number
  approvedAt?: number // legacy (before reject existed): same as decision 'approved'
}

export function decisionOf(p: StoredPaper): { decision: Decision; at: number } | null {
  if (p.decision && p.decidedAt) return { decision: p.decision, at: p.decidedAt }
  if (p.approvedAt) return { decision: 'approved', at: p.approvedAt }
  return null
}

export const paperKey = (code: string) => `${PAPER_PREFIX}${code}`

const isDev = process.env.NODE_ENV !== 'production'
const g = globalThis as unknown as { __paperDeskMem?: Map<string, StoredPaper> }
const mem = (g.__paperDeskMem ??= new Map())
let warned = false

async function withFallback<T>(redisOp: () => Promise<T>, memOp: () => T): Promise<T> {
  try {
    return await redisOp()
  } catch (e) {
    if (!isDev) throw e
    if (!warned) {
      warned = true
      console.warn('[paper-desk] Redis unavailable, using in-memory store (dev only):', (e as Error).message)
    }
    return memOp()
  }
}

export function getPaper(code: string): Promise<StoredPaper | null> {
  return withFallback(
    () => getRedis().get<StoredPaper>(paperKey(code)),
    () => mem.get(code) ?? null,
  )
}

export function paperExists(code: string): Promise<boolean> {
  return withFallback(
    async () => (await getRedis().exists(paperKey(code))) > 0,
    () => mem.has(code),
  )
}

export function savePaper(code: string, paper: StoredPaper, keepTtl = false): Promise<void> {
  return withFallback(
    async () => {
      await getRedis().set(paperKey(code), paper, keepTtl ? { keepTtl: true } : { ex: PAPER_TTL_SECONDS })
    },
    () => void mem.set(code, paper),
  )
}
