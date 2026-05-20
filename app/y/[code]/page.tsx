import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getRedis, CFG_PREFIX, OWNER_PREFIX, statsKey, type StoredConfig } from '@/lib/force-yes/redis'
import { isValidShortCode } from '@/lib/force-yes/codes'
import { OWNER_COOKIE_NAME } from '@/lib/force-yes/constants'
import ForceYesClient from './ForceYesClient'

type Props = {
  params: { code: string }
}

export const metadata = {
  robots: { index: false, follow: false },
}

async function loadConfig(code: string): Promise<StoredConfig | null> {
  if (!isValidShortCode(code)) return null
  try {
    return await getRedis().get<StoredConfig>(`${CFG_PREFIX}${code}`)
  } catch {
    return null
  }
}

export default async function ForceYesPage({ params }: Props) {
  const cfg = await loadConfig(params.code)
  if (!cfg) notFound()

  const ownerId = cookies().get(OWNER_COOKIE_NAME)?.value
  let isOwner = false
  if (ownerId) {
    try {
      const ownedCode = await getRedis().get<string>(`${OWNER_PREFIX}${ownerId}`)
      isOwner = ownedCode === params.code
    } catch {}
  }

  let stats: { yesCount: number; noCount: number } | null = null
  if (isOwner) {
    try {
      const [yesRaw, noRaw] = await getRedis().mget<(number | string | null)[]>(
        statsKey(params.code, 'yes'),
        statsKey(params.code, 'no'),
      )
      stats = { yesCount: Number(yesRaw ?? 0), noCount: Number(noRaw ?? 0) }
    } catch {}
  }

  return (
    <ForceYesClient
      code={params.code}
      isOwner={isOwner}
      ownerStats={stats}
      questionText={cfg.questionText ?? '你愿意做我女朋友吗？'}
      yesText={cfg.yesText}
      noText={cfg.noText}
      yesEffectText={cfg.yesEffectText}
      yesMeme={cfg.yesMeme}
      noMemes={cfg.noMemes}
    />
  )
}

export const dynamic = 'force-dynamic'
