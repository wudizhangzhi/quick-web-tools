import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getRedis, CFG_PREFIX, OWNER_PREFIX, type StoredConfig } from '@/lib/force-yes/redis'
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

  return (
    <ForceYesClient
      code={params.code}
      isOwner={isOwner}
      yesText={cfg.yesText}
      noText={cfg.noText}
      yesEffectText={cfg.yesEffectText}
      yesMeme={cfg.yesMeme}
      noMemes={cfg.noMemes}
    />
  )
}

export const dynamic = 'force-dynamic'
