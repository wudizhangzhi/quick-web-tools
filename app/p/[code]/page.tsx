import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Trophy, ArrowRight } from 'lucide-react'
import { getRedis, codeKey, predKey } from '@/lib/world-cup/redis'
import { isValidShareCode } from '@/lib/world-cup/codes'
import { loadData } from '@/lib/world-cup/fixtures'
import { computeStats } from '@/lib/world-cup/scoring'
import BracketTree from '@/components/world-cup/BracketTree'
import type { Choice, Predictions } from '@/lib/world-cup/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'TA 的世界杯预测 - Quick Web Tools',
  robots: { index: false, follow: false },
}

async function loadPredictions(code: string): Promise<Predictions | null> {
  if (!isValidShareCode(code)) return null
  try {
    const redis = getRedis()
    const uid = await redis.get<string>(codeKey(code))
    if (!uid) return null
    const preds = await redis.hgetall<Record<string, Choice>>(predKey(uid))
    return preds ?? {}
  } catch {
    return null
  }
}

export default async function SharePage({ params }: { params: { code: string } }) {
  const predictions = await loadPredictions(params.code)
  if (predictions === null) notFound()

  const data = loadData()
  const stats = computeStats(predictions, data)
  const pct = stats.resolved > 0 ? Math.round(stats.accuracy * 100) : null

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <header className="mb-6 text-center">
        <Trophy className="mx-auto mb-2 text-amber-500" size={32} />
        <h1 className="text-2xl font-bold text-gray-900">TA 的{data.title}预测</h1>
        <p className="mt-2 text-sm text-gray-600">
          已猜 <b className="text-gray-900">{stats.predicted}</b> 场
          {pct != null ? (
            <>
              {' · '}已猜对 <b className="text-green-600">{stats.correct}</b>/{stats.resolved}，正确率{' '}
              <b className="text-amber-600">{pct}%</b>
            </>
          ) : (
            ' · 赛果尚未公布'
          )}
        </p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">晋级树预测</h2>
        <BracketTree data={data} predictions={predictions} />
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/tools/world-cup-predict"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600"
        >
          我也来猜
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
