import { NextRequest, NextResponse } from 'next/server'
import { getRedis, predKey, UID_COOKIE_NAME, WC_TTL_SECONDS } from '@/lib/world-cup/redis'
import { generateUid } from '@/lib/world-cup/codes'
import { getMatch, isLocked, isPlaceholder, validChoice } from '@/lib/world-cup/fixtures'
import type { Choice } from '@/lib/world-cup/types'

type Body = { matchId?: string; choice?: Choice }

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const matchId = body.matchId
  const choice = body.choice
  if (!matchId || (choice !== 'home' && choice !== 'draw' && choice !== 'away')) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const match = getMatch(matchId)
  if (!match) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (isPlaceholder(match)) return NextResponse.json({ error: 'not_predictable' }, { status: 400 })
  if (!validChoice(match.stage, choice)) {
    return NextResponse.json({ error: 'invalid_choice' }, { status: 400 })
  }
  if (isLocked(match, Date.now())) return NextResponse.json({ error: 'locked' }, { status: 409 })

  let uid = req.cookies.get(UID_COOKIE_NAME)?.value
  if (!uid) uid = generateUid()

  try {
    const redis = getRedis()
    await redis.hset(predKey(uid), { [matchId]: choice })
    await redis.expire(predKey(uid), WC_TTL_SECONDS)
  } catch (e) {
    console.warn('[world-cup/predict] redis write failed:', e)
    return NextResponse.json({ error: 'upstream' }, { status: 503 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(UID_COOKIE_NAME, uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: WC_TTL_SECONDS,
    path: '/',
  })
  return res
}
