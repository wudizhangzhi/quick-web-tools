import { NextRequest, NextResponse } from 'next/server'
import { getRedis, CFG_PREFIX, OWNER_PREFIX, type StoredConfig } from '@/lib/force-yes/redis'
import { generateShortCode, generateOwnerId } from '@/lib/force-yes/codes'
import { verifyTurnstile } from '@/lib/force-yes/turnstile'
import { isHappyMeme, isSadMeme } from '@/lib/force-yes/memes'
import {
  CONFIG_TTL_SECONDS,
  OWNER_COOKIE_NAME,
  YES_TEXT_MAX,
  NO_TEXT_MAX,
  YES_EFFECT_TEXT_MAX,
} from '@/lib/force-yes/constants'

type CreateBody = {
  yesText?: string
  noText?: string
  yesEffectText?: string
  yesMeme?: string
  noMemes?: string[]
  turnstileToken?: string
}

function badRequest(reason: string) {
  return NextResponse.json({ error: reason }, { status: 400 })
}

export async function POST(req: NextRequest) {
  let body: CreateBody
  try {
    body = (await req.json()) as CreateBody
  } catch {
    return badRequest('invalid_json')
  }

  const yesText = (body.yesText ?? '').trim()
  const noText = (body.noText ?? '').trim()
  const yesEffectText = (body.yesEffectText ?? '').trim()
  const yesMeme = body.yesMeme ?? ''
  const noMemes = body.noMemes ?? []
  const turnstileToken = body.turnstileToken ?? ''

  if (!yesText || yesText.length > YES_TEXT_MAX) return badRequest('invalid_yes_text')
  if (!noText || noText.length > NO_TEXT_MAX) return badRequest('invalid_no_text')
  if (!yesEffectText || yesEffectText.length > YES_EFFECT_TEXT_MAX) return badRequest('invalid_effect_text')
  if (!isHappyMeme(yesMeme)) return badRequest('invalid_yes_meme')
  if (!Array.isArray(noMemes) || noMemes.length !== 3) return badRequest('invalid_no_memes')
  if (new Set(noMemes).size !== 3) return badRequest('duplicate_no_memes')
  for (const id of noMemes) {
    if (!isSadMeme(id)) return badRequest('invalid_no_memes')
  }

  const remoteIp = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ok = await verifyTurnstile(turnstileToken, remoteIp ?? undefined)
  if (!ok) return NextResponse.json({ error: 'turnstile_failed' }, { status: 400 })

  const redis = getRedis()
  const existingOwner = req.cookies.get(OWNER_COOKIE_NAME)?.value
  let ownerId = existingOwner ?? null
  let code: string | null = null
  let mode: 'create' | 'overwrite' = 'create'

  if (ownerId) {
    const existingCode = await redis.get<string>(`${OWNER_PREFIX}${ownerId}`)
    if (existingCode) {
      code = existingCode
      mode = 'overwrite'
    }
  }

  if (!code) {
    for (let i = 0; i < 5; i++) {
      const candidate = generateShortCode()
      const exists = await redis.exists(`${CFG_PREFIX}${candidate}`)
      if (!exists) {
        code = candidate
        break
      }
    }
    if (!code) return NextResponse.json({ error: 'code_collision' }, { status: 500 })
    if (!ownerId) ownerId = generateOwnerId()
  }

  const cfg: StoredConfig = {
    yesText,
    noText,
    yesEffectText,
    yesMeme,
    noMemes: [noMemes[0], noMemes[1], noMemes[2]],
    createdAt: Date.now(),
  }

  await redis.set(`${CFG_PREFIX}${code}`, cfg, { ex: CONFIG_TTL_SECONDS })
  await redis.set(`${OWNER_PREFIX}${ownerId!}`, code, { ex: CONFIG_TTL_SECONDS })

  const res = NextResponse.json({ code, mode })
  res.cookies.set(OWNER_COOKIE_NAME, ownerId!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CONFIG_TTL_SECONDS,
    path: '/',
  })
  return res
}
