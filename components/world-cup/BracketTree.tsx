import type { Choice, Match, Stage, Team, WorldCupData } from '@/lib/world-cup/types'
import { stageLabel } from '@/lib/world-cup/labels'
import Flag from './Flag'

const ROUND_STAGES: Stage[] = ['r32', 'r16', 'qf', 'sf', 'final']

function isPlaceholderTeam(t: Team): boolean {
  return t.placeholder != null
}

function TeamRow({
  team,
  side,
  match,
  pick,
}: {
  team: Team
  side: 'home' | 'away'
  match: Match
  pick?: Choice
}) {
  const resolved = match.result != null
  const picked = pick === side
  const isWinner = resolved && match.result === side
  const pickedButLost = resolved && picked && match.result !== side

  let tone = 'text-gray-700'
  if (isWinner) tone = 'bg-green-50 text-green-800 font-semibold'
  else if (pickedButLost) tone = 'bg-red-50 text-red-600'
  else if (picked) tone = 'bg-amber-50 text-amber-900 font-semibold'

  return (
    <div className={`flex items-center gap-1.5 rounded px-2 py-1 ${tone}`}>
      <Flag code={team.code} className="h-3.5 w-5 shrink-0 rounded-[2px]" />
      <span className="flex-1 truncate">{isPlaceholderTeam(team) ? '待定' : team.name}</span>
      {picked && <span className="shrink-0 text-[10px] opacity-70">你猜</span>}
    </div>
  )
}

function MatchNode({ match, pick }: { match: Match; pick?: Choice }) {
  const resolved = match.result != null
  const correct = resolved && pick != null && match.result === pick
  const wrong = resolved && pick != null && match.result !== pick

  return (
    <div className="relative w-full rounded-lg border border-gray-200 bg-white text-xs shadow-sm">
      <div className="divide-y divide-gray-100">
        <TeamRow team={match.home} side="home" match={match} pick={pick} />
        <TeamRow team={match.away} side="away" match={match} pick={pick} />
      </div>
      {correct && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
          ✓
        </span>
      )}
      {wrong && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
          ✗
        </span>
      )}
    </div>
  )
}

export default function BracketTree({
  data,
  predictions,
}: {
  data: WorldCupData
  predictions: Record<string, Choice>
}) {
  const byStage = (stage: Stage): Match[] =>
    data.matches.filter((m) => m.stage === stage).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))

  const third = data.matches.find((m) => m.stage === 'third')
  const rounds = ROUND_STAGES.map((stage) => ({ stage, matches: byStage(stage) }))

  return (
    <div>
      {/* Desktop: classic left→right bracket with widening gaps */}
      <div className="hidden md:block overflow-x-auto pb-2">
        <div className="flex gap-6">
          {rounds.map((r) => (
            <div key={r.stage} className="min-w-[160px] text-center text-xs font-semibold text-gray-500">
              {stageLabel(r.stage)}
            </div>
          ))}
        </div>
        <div className="flex gap-6">
          {rounds.map((r) => (
            <div key={r.stage} className="flex min-w-[160px] flex-col justify-around gap-3">
              {r.matches.map((m) => (
                <MatchNode key={m.id} match={m} pick={predictions[m.id]} />
              ))}
            </div>
          ))}
        </div>
        {third && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500">季军战</span>
            <div className="w-[160px]">
              <MatchNode match={third} pick={predictions[third.id]} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile: vertical bands, one row per round */}
      <div className="space-y-5 md:hidden">
        {[...rounds, ...(third ? [{ stage: 'third' as Stage, matches: [third] }] : [])].map((r) => (
          <section key={r.stage}>
            <h3 className="mb-2 text-sm font-semibold text-gray-600">{stageLabel(r.stage)}</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {r.matches.map((m) => (
                <div key={m.id} className="w-36 shrink-0">
                  <MatchNode match={m} pick={predictions[m.id]} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
