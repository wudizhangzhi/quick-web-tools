import { NextRequest, NextResponse } from 'next/server'
import {
  getRedis,
  predKey,
  codeKey,
  uidCodeKey,
  UID_COOKIE_NAME,
  WC_TTL_SECONDS,
} from '@/lib/world-cup/redis'
import { generateShareCode } from '@/lib/world-cup/codes'

export async function POST(req: NextRequest) {
  const uid = req.cookies.get(UID_COOKIE_NAME)?.value
  if (!uid) return NextResponse.json({ error: 'no_predictions' }, { status: 400 })

  try {
    const redis = getRedis()
    const count = await redis.hlen(predKey(uid))
    if (!count) return NextResponse.json({ error: 'no_predictions' }, { status: 400 })

    let code = await redis.get<string>(uidCodeKey(uid))
    if (code) {
      // Refresh TTL so an active sharer's link doesn't expire.
      await Promise.all([
        redis.expire(codeKey(code), WC_TTL_SECONDS),
        redis.expire(uidCodeKey(uid), WC_TTL_SECONDS),
      ])
      return NextResponse.json({ code })
    }

    for (let i = 0; i < 5; i++) {
      const candidate = generateShareCode()
      if (!(await redis.exists(codeKey(candidate)))) {
        code = candidate
        break
      }
    }
    if (!code) return NextResponse.json({ error: 'code_collision' }, { status: 500 })

    await Promise.all([
      redis.set(codeKey(code), uid, { ex: WC_TTL_SECONDS }),
      redis.set(uidCodeKey(uid), code, { ex: WC_TTL_SECONDS }),
    ])
    return NextResponse.json({ code })
  } catch (e) {
    console.warn('[world-cup/share] redis failed:', e)
    return NextResponse.json({ error: 'upstream' }, { status: 503 })
  }
}
