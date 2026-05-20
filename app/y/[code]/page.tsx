import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getRedis, CFG_PREFIX, type StoredConfig } from '@/lib/force-yes/redis'
import { isValidShortCode } from '@/lib/force-yes/codes'
import ForceYesClient from './ForceYesClient'

type Props = {
  params: { code: string }
}

export const metadata = {
  robots: { index: false, follow: false },
}

export const revalidate = 60

const loadConfig = unstable_cache(
  async (code: string): Promise<StoredConfig | null> => {
    if (!isValidShortCode(code)) return null
    try {
      return await getRedis().get<StoredConfig>(`${CFG_PREFIX}${code}`)
    } catch {
      return null
    }
  },
  ['force-yes-cfg'],
  { revalidate: 60, tags: ['force-yes-cfg'] },
)

export default async function ForceYesPage({ params }: Props) {
  const cfg = await loadConfig(params.code)
  if (!cfg) notFound()

  return (
    <ForceYesClient
      code={params.code}
      questionText={cfg.questionText ?? '你愿意做我女朋友吗？'}
      yesText={cfg.yesText}
      noText={cfg.noText}
      yesEffectText={cfg.yesEffectText}
      yesMeme={cfg.yesMeme}
      noMemes={cfg.noMemes}
    />
  )
}
