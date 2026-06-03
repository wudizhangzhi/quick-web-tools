import { NextRequest, NextResponse } from 'next/server'
import { getRedis, predKey, UID_COOKIE_NAME } from '@/lib/world-cup/redis'
import type { Choice } from '@/lib/world-cup/types'

export async function GET(req: NextRequest) {
  const uid = req.cookies.get(UID_COOKIE_NAME)?.value
  if (!uid) return NextResponse.json({ predictions: {} })

  try {
    const redis = getRedis()
    const preds = await redis.hgetall<Record<string, Choice>>(predKey(uid))
    return NextResponse.json({ predictions: preds ?? {} })
  } catch (e) {
    console.warn('[world-cup/me] redis read failed:', e)
    return NextResponse.json({ predictions: {} })
  }
}
