import { NextRequest, NextResponse } from 'next/server'
import { getRedis, CFG_PREFIX, type StoredConfig } from '@/lib/force-yes/redis'
import { isValidShortCode } from '@/lib/force-yes/codes'

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code
  if (!isValidShortCode(code)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const cfg = await getRedis().get<StoredConfig>(`${CFG_PREFIX}${code}`)
  if (!cfg) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const { createdAt: _drop, ...publicCfg } = cfg
  return NextResponse.json(publicCfg, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  })
}
