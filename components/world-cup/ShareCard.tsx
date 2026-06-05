import { forwardRef } from 'react'
import { Trophy } from 'lucide-react'
import type { Stats } from '@/lib/world-cup/scoring'
import { accuracyTitle } from '@/lib/world-cup/scoring'
import type { Team } from '@/lib/world-cup/types'
import Flag from './Flag'

// The shareable poster (plan B). Fixed 360×480 so html-to-image exports a
// predictable 3:4 image; screenshot at a higher pixelRatio for crispness.
// Adapts to two states: once results exist it leads with the accuracy title,
// otherwise (incl. pre-tournament) it shows the pick count. The champion line
// only appears when the user has actually picked the final with real teams.
const ShareCard = forwardRef<
  HTMLDivElement,
  {
    title: string
    stats: Stats
    champion: Team | null
    qrDataUrl: string | null
  }
>(function ShareCard({ title, stats, champion, qrDataUrl }, ref) {
  const hasResults = stats.resolved > 0
  const pct = Math.round(stats.accuracy * 100)
  const tier = hasResults ? accuracyTitle(pct) : null

  return (
    <div
      ref={ref}
      style={{ width: 360, height: 480 }}
      className="relative flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-green-950 px-7 py-7 text-white"
    >
      {/* decorative glows + watermark trophy */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
      <Trophy
        className="pointer-events-none absolute -bottom-8 -right-6 text-white/[0.06]"
        size={220}
        strokeWidth={1}
      />

      {/* header */}
      <div className="relative z-10 flex flex-col gap-2">
        <span className="self-start rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
          预测战报
        </span>
        <h1 className="text-2xl font-black leading-tight">我的{title}预测</h1>
      </div>

      {/* center */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        {tier ? (
          <>
            <span className="text-6xl leading-none drop-shadow-md">{tier.emoji}</span>
            <div className="mt-2 text-3xl font-black leading-tight drop-shadow-sm">{tier.title}</div>
            <div className="mt-3 rounded-full bg-amber-400/90 px-4 py-1.5 text-sm font-bold text-emerald-950">
              正确率 {pct}% · 猜对 {stats.correct}/{stats.resolved}
            </div>
          </>
        ) : (
          <>
            <span className="text-5xl leading-none">🏆</span>
            <div className="mt-3 text-lg font-semibold text-white/90">已猜</div>
            <div className="text-5xl font-black leading-none text-amber-300">{stats.predicted}</div>
            <div className="mt-1 text-lg font-semibold text-white/90">场</div>
            <div className="mt-3 text-xs text-white/60">赛果揭晓后见真章</div>
          </>
        )}

        {champion && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5">
            <span className="text-xs font-medium text-white/70">我猜的冠军</span>
            <Flag code={champion.code} className="h-5 w-7 rounded-sm" alt={champion.name} />
            <span className="text-sm font-bold">{champion.name}</span>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="relative z-10 flex items-center gap-3">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="" className="h-16 w-16 rounded-lg bg-white p-1" />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-white/20" />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-amber-300">扫码也来猜 →</span>
          <span className="text-[11px] text-white/60">看看你能猜对几场</span>
        </div>
      </div>
    </div>
  )
})

export default ShareCard
