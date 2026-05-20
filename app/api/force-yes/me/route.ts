import { NextRequest, NextResponse } from 'next/server'
import { getRedis, OWNER_PREFIX, statsKey } from '@/lib/force-yes/redis'
import { OWNER_COOKIE_NAME } from '@/lib/force-yes/constants'

export async function GET(req: NextRequest) {
  const ownerId = req.cookies.get(OWNER_COOKIE_NAME)?.value
  if (!ownerId) return NextResponse.json({})
  try {
    const redis = getRedis()
    const code = await redis.get<string>(`${OWNER_PREFIX}${ownerId}`)
    if (!code) return NextResponse.json({})
    const [yesRaw, noRaw] = await redis.mget<(number | string | null)[]>(
      statsKey(code, 'yes'),
      statsKey(code, 'no'),
    )
    return NextResponse.json({
      code,
      yesCount: Number(yesRaw ?? 0),
      noCount: Number(noRaw ?? 0),
    })
  } catch (e) {
    console.warn('[force-yes/me] redis lookup failed:', e)
    return NextResponse.json({}, { status: 200 })
  }
}
