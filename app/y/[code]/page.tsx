import { notFound } from 'next/navigation'
import { getRedis, CFG_PREFIX, type StoredConfig } from '@/lib/force-yes/redis'
import { isValidShortCode } from '@/lib/force-yes/codes'
import ForceYesClient from './ForceYesClient'

type Props = {
  params: { code: string }
  searchParams: { owner?: string }
}

async function loadConfig(code: string): Promise<StoredConfig | null> {
  if (!isValidShortCode(code)) return null
  try {
    return await getRedis().get<StoredConfig>(`${CFG_PREFIX}${code}`)
  } catch {
    return null
  }
}

export default async function ForceYesPage({ params, searchParams }: Props) {
  const cfg = await loadConfig(params.code)
  if (!cfg) notFound()
  return (
    <ForceYesClient
      code={params.code}
      isOwner={searchParams.owner === '1'}
      yesText={cfg.yesText}
      noText={cfg.noText}
      yesEffectText={cfg.yesEffectText}
      yesMeme={cfg.yesMeme}
      noMemes={cfg.noMemes}
    />
  )
}

export const dynamic = 'force-dynamic'
