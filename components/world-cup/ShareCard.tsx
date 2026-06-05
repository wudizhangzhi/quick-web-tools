import { forwardRef } from 'react'
import { Trophy } from 'lucide-react'
import type { Stats } from '@/lib/world-cup/scoring'
import { accuracyTitle } from '@/lib/world-cup/scoring'
import { matchLabel, kickoffLabel } from '@/lib/world-cup/labels'
import type { FeaturedMatch } from '@/lib/world-cup/featured'
import type { Team } from '@/lib/world-cup/types'
import Flag from './Flag'

// One side of the featured matchup. The picked side gets an amber ring + check;
// the other side dims. A draw highlights neither (the "我猜平" tag carries it).
function TeamSide({ team, picked, dimmed }: { team: Team; picked: boolean; dimmed: boolean }) {
  return (
    <div className={`flex flex-1 flex-col items-center gap-1 ${dimmed ? 'opacity-50' : ''}`}>
      <div className="relative">
        <Flag
          code={team.code}
          alt={team.name}
          className={`h-8 w-12 rounded-md shadow-sm ${picked ? 'ring-2 ring-amber-300' : ''}`}
        />
        {picked && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-emerald-950">
            ✓
          </span>
        )}
      </div>
      <span
        className={`text-center text-xs font-bold leading-tight ${picked ? 'text-amber-300' : 'text-white'}`}
      >
        {team.name}
      </span>
    </div>
  )
}

// The shareable poster (plan B). Fixed 360×480 so html-to-image exports a
// predictable 3:4 image; screenshot at a higher pixelRatio for crispness.
// Leads with the accuracy title (or pick count pre-results), spotlights one of
// the user's own picks, and shows the champion pick when it's known.
const ShareCard = forwardRef<
  HTMLDivElement,
  {
    title: string
    stats: Stats
    champion: Team | null
    featured: FeaturedMatch | null
    qrDataUrl: string | null
  }
>(function ShareCard({ title, stats, champion, featured, qrDataUrl }, ref) {
  const hasResults = stats.resolved > 0
  const pct = Math.round(stats.accuracy * 100)
  const tier = hasResults ? accuracyTitle(pct) : null
  const choice = featured?.choice

  return (
    <div
      ref={ref}
      style={{ width: 360, height: 480 }}
      className="relative flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-green-950 px-7 py-6 text-white"
    >
      {/* decorative glows + watermark trophy */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
      <Trophy
        className="pointer-events-none absolute -bottom-8 -right-6 text-white/[0.06]"
        size={200}
        strokeWidth={1}
      />

      {/* header */}
      <div className="relative z-10 flex flex-col gap-1.5">
        <span className="self-start rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
          预测战报
        </span>
        <h1 className="text-2xl font-black leading-tight">我的{title}预测</h1>
      </div>

      {/* center */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 text-center">
        {tier ? (
          <div className="flex flex-col items-center">
            <span className="text-5xl leading-none drop-shadow-md">{tier.emoji}</span>
            <div className="mt-1.5 text-2xl font-black leading-tight drop-shadow-sm">{tier.title}</div>
            <div className="mt-2.5 rounded-full bg-amber-400/90 px-4 py-1 text-xs font-bold text-emerald-950">
              正确率 {pct}% · 猜对 {stats.correct}/{stats.resolved}
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl">🏆</span>
            <span className="text-base font-semibold text-white/90">已猜</span>
            <span className="text-4xl font-black leading-none text-amber-300">{stats.predicted}</span>
            <span className="text-base font-semibold text-white/90">场</span>
          </div>
        )}

        {/* featured pick — shows the user's guess, never the real result */}
        {featured && (
          <div className="w-full rounded-2xl bg-white/10 px-4 py-3">
            <div className="mb-2 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                <span>我猜这场</span>
                <span>·</span>
                <span>{matchLabel(featured.match)}</span>
              </div>
              <div className="text-[10px] text-white/45">
                {kickoffLabel(featured.match.kickoff)}（北京时间）
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <TeamSide
                team={featured.match.home}
                picked={choice === 'home'}
                dimmed={choice === 'away'}
              />
              <span className="shrink-0 text-xs font-bold text-white/80">
                {choice === 'draw' ? '我猜平' : 'VS'}
              </span>
              <TeamSide
                team={featured.match.away}
                picked={choice === 'away'}
                dimmed={choice === 'home'}
              />
            </div>
          </div>
        )}

        {champion && (
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5">
            <span className="text-[11px] font-medium text-white/70">我猜的冠军</span>
            <Flag code={champion.code} className="h-4 w-6 rounded-sm" alt={champion.name} />
            <span className="text-xs font-bold">{champion.name}</span>
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
