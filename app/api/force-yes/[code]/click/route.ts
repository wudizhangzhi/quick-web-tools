import { NextRequest, NextResponse } from 'next/server'
import { getRedis, CFG_PREFIX, statsKey } from '@/lib/force-yes/redis'
import { isValidShortCode } from '@/lib/force-yes/codes'
import { CONFIG_TTL_SECONDS } from '@/lib/force-yes/constants'

type ClickBody = { choice?: 'yes' | 'no' }

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code
  if (!isValidShortCode(code)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  let body: ClickBody
  try {
    body = (await req.json()) as ClickBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (body.choice !== 'yes' && body.choice !== 'no') {
    return NextResponse.json({ error: 'invalid_choice' }, { status: 400 })
  }

  try {
    const redis = getRedis()
    const exists = await redis.exists(`${CFG_PREFIX}${code}`)
    if (!exists) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const key = statsKey(code, body.choice)
    await redis.incr(key)
    await redis.expire(key, CONFIG_TTL_SECONDS)
  } catch (e) {
    console.warn('[force-yes/click] redis incr failed:', e)
    return NextResponse.json({ error: 'upstream' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
