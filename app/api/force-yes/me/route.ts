import { NextRequest, NextResponse } from 'next/server'
import { getRedis, OWNER_PREFIX } from '@/lib/force-yes/redis'
import { OWNER_COOKIE_NAME } from '@/lib/force-yes/constants'

export async function GET(req: NextRequest) {
  const ownerId = req.cookies.get(OWNER_COOKIE_NAME)?.value
  if (!ownerId) return NextResponse.json({})
  try {
    const code = await getRedis().get<string>(`${OWNER_PREFIX}${ownerId}`)
    if (!code) return NextResponse.json({})
    return NextResponse.json({ code })
  } catch (e) {
    console.warn('[force-yes/me] redis lookup failed:', e)
    return NextResponse.json({}, { status: 200 })
  }
}
