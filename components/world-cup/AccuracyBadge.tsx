import type { Stats } from '@/lib/world-cup/scoring'
import { accuracyTitle } from '@/lib/world-cup/scoring'

// Celebratory rank banner. Renders nothing until at least one match is resolved,
// since a title only makes sense once there are real results to score against.
// `hero` is the large, standalone treatment used on the share page; the default
// is the compact strip used inline on the dashboard.
export default function AccuracyBadge({
  stats,
  size = 'default',
}: {
  stats: Stats
  size?: 'default' | 'hero'
}) {
  if (stats.resolved <= 0) return null

  const pct = Math.round(stats.accuracy * 100)
  const tier = accuracyTitle(pct)

  if (size === 'hero') {
    return (
      <div className="wc-badge-pop wc-badge-shine relative mx-auto flex max-w-sm flex-col items-center gap-1.5 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 px-8 py-7 text-white shadow-2xl shadow-amber-900/40 ring-1 ring-white/40">
        <span className="wc-badge-emoji text-6xl leading-none drop-shadow-md" aria-hidden>
          {tier.emoji}
        </span>
        <div className="text-center text-3xl font-black leading-tight drop-shadow-sm">
          {tier.title}
        </div>
        <div className="mt-1.5 rounded-full bg-black/15 px-3.5 py-1 text-xs font-semibold tracking-wide">
          正确率 {pct}% · 猜对 {stats.correct}/{stats.resolved}
        </div>
      </div>
    )
  }

  return (
    <div className="wc-badge-pop wc-badge-shine relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-4 text-white shadow-sm">
      <span className="wc-badge-emoji text-3xl leading-none" aria-hidden>
        {tier.emoji}
      </span>
      <div className="text-center">
        <div className="text-lg font-extrabold leading-tight">{tier.title}</div>
        <div className="mt-0.5 text-xs font-medium text-white/90">
          {stats.resolved} 场已揭晓 · 猜对 {stats.correct} · 正确率 {pct}%
        </div>
      </div>
    </div>
  )
}
