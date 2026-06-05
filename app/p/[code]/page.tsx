import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Trophy, ArrowRight, Sparkles } from 'lucide-react'
import { loadDisplayData } from '@/lib/world-cup/fixtures'
import { computeStats } from '@/lib/world-cup/scoring'
import { loadPredictionsByCode } from '@/lib/world-cup/share-data'
import BracketTree from '@/components/world-cup/BracketTree'
import AccuracyBadge from '@/components/world-cup/AccuracyBadge'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'TA 的世界杯预测 - Quick Web Tools',
  robots: { index: false, follow: false },
}

export default async function SharePage({ params }: { params: { code: string } }) {
  const predictions = await loadPredictionsByCode(params.code)
  if (predictions === null) notFound()

  const data = loadDisplayData()
  const stats = computeStats(predictions, data)
  const pct = stats.resolved > 0 ? Math.round(stats.accuracy * 100) : null

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-green-950 text-white">
      {/* decorative background */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <Trophy
        className="pointer-events-none absolute -bottom-12 -right-8 text-white/[0.05]"
        size={300}
        strokeWidth={1}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 md:py-14">
        {/* hero */}
        <header className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur">
            <Sparkles size={12} /> 预测战报
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            TA 的{data.title}预测
          </h1>

          <div className="mt-6">
            {pct != null ? (
              <AccuracyBadge stats={stats} size="hero" />
            ) : (
              <div className="mx-auto inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm text-white/85 backdrop-blur">
                <Trophy size={18} className="text-amber-300" />
                赛果尚未公布 · 已猜 <b className="text-white">{stats.predicted}</b> 场
              </div>
            )}
          </div>

          {pct != null && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
                已猜 <b>{stats.predicted}</b> 场
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
                已揭晓 <b>{stats.resolved}</b>
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
                猜对 <b className="text-amber-300">{stats.correct}</b>
              </span>
            </div>
          )}

          {/* primary CTA, kept up top under the stats so it's the obvious next tap */}
          <div className="mt-6">
            <Link
              href="/wc"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3.5 text-base font-bold text-emerald-950 shadow-lg shadow-amber-500/30 transition-transform hover:scale-105 active:scale-95"
            >
              我也来猜
              <ArrowRight size={18} />
            </Link>
            <p className="mt-2 text-xs text-white/60">觉得 TA 猜得准？换你来挑战</p>
          </div>
        </header>

        {/* full prediction on a bright card that floats over the dark stage */}
        <div className="mt-8 rounded-3xl bg-white p-5 text-gray-900 shadow-2xl md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">完整预测</h2>
          <BracketTree data={data} predictions={predictions} />
        </div>
      </div>
    </div>
  )
}
