import { getRedis, codeKey, predKey } from './redis'
import { isValidShareCode } from './codes'
import type { Choice, Predictions } from './types'

// Resolve a share code to the owner's predictions. Returns null for an invalid /
// unknown code (callers 404 or fall back); an empty object means a known owner
// with no picks yet. Shared by the /p/[code] page and its OG image.
export async function loadPredictionsByCode(code: string): Promise<Predictions | null> {
  if (!isValidShareCode(code)) return null
  try {
    const redis = getRedis()
    const uid = await redis.get<string>(codeKey(code))
    if (!uid) return null
    const preds = await redis.hgetall<Record<string, Choice>>(predKey(uid))
    return preds ?? {}
  } catch {
    return null
  }
}
