import { NextRequest, NextResponse } from 'next/server'
import { generateShortCode } from '@/lib/force-yes/codes'
import { verifyTurnstile } from '@/lib/force-yes/turnstile'
import { isBlank, sanitizeConfig } from '@/lib/paper-desk/config'
import { paperExists, savePaper } from '@/lib/paper-desk/store'

const MAX_BODY_BYTES = 8 * 1024

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 })
  let body: { cfg?: unknown; turnstileToken?: string }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const cfg = sanitizeConfig(body.cfg)
  if (isBlank(cfg)) return NextResponse.json({ error: 'empty' }, { status: 400 })

  const remoteIp = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ok = await verifyTurnstile(body.turnstileToken ?? '', remoteIp ?? undefined)
  if (!ok) return NextResponse.json({ error: 'turnstile_failed' }, { status: 400 })

  // every share is a new link — people write more than one letter
  let code: string | null = null
  for (let i = 0; i < 5; i++) {
    const candidate = generateShortCode()
    if (!(await paperExists(candidate))) {
      code = candidate
      break
    }
  }
  if (!code) return NextResponse.json({ error: 'code_collision' }, { status: 500 })

  await savePaper(code, { cfg, createdAt: Date.now() })
  return NextResponse.json({ code })
}
