import type { Choice, Match, Team } from '@/lib/world-cup/types'
import Flag from './Flag'

function teamName(t: Team): string {
  return t.placeholder != null ? '待定' : t.name
}

function TeamRow({
  team,
  side,
  match,
  pick,
  size,
}: {
  team: Team
  side: 'home' | 'away'
  match: Match
  pick?: Choice
  size: 'sm' | 'md'
}) {
  const resolved = match.result != null
  const picked = pick === side
  const isWinner = resolved && match.result === side
  const pickedButLost = resolved && picked && match.result !== side

  let tone = 'text-gray-700'
  if (isWinner) tone = 'bg-green-50 text-green-800 font-semibold'
  else if (pickedButLost) tone = 'bg-red-50 text-red-600'
  else if (picked) tone = 'bg-amber-50 text-amber-900 font-semibold'

  const flagCls = size === 'md' ? 'h-4 w-6' : 'h-3.5 w-5'
  const pad = size === 'md' ? 'px-2.5 py-2' : 'px-1.5 py-1'

  return (
    <div className={`flex items-center gap-1.5 rounded ${pad} ${tone}`}>
      <Flag code={team.code} className={`${flagCls} shrink-0 rounded-[2px]`} />
      <span className="flex-1 truncate">{teamName(team)}</span>
      {picked && <span className="shrink-0 text-[10px] opacity-70">你猜</span>}
    </div>
  )
}

// A single knockout matchup card. `sm` is the compact size used in the desktop
// bracket tree; `md` is the roomier size used in the mobile round-by-round list.
export default function MatchNode({
  match,
  pick,
  size = 'sm',
}: {
  match: Match
  pick?: Choice
  size?: 'sm' | 'md'
}) {
  const resolved = match.result != null
  const correct = resolved && pick != null && match.result === pick
  const wrong = resolved && pick != null && match.result !== pick

  let nodeTone = 'border-gray-200'
  if (correct) nodeTone = 'border-green-400 ring-1 ring-green-200'
  else if (wrong) nodeTone = 'border-red-300'

  const textCls = size === 'md' ? 'text-sm' : 'text-[11px]'

  return (
    <div className={`relative w-full rounded-lg border bg-white shadow-sm ${textCls} ${nodeTone}`}>
      <div className="divide-y divide-gray-100">
        <TeamRow team={match.home} side="home" match={match} pick={pick} size={size} />
        <TeamRow team={match.away} side="away" match={match} pick={pick} size={size} />
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
