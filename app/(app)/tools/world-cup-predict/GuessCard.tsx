'use client'

import type { Choice, Match } from '@/lib/world-cup/types'
import { matchLabel, kickoffLabel } from '@/lib/world-cup/labels'

function TeamPill({ code, name }: { code: string | null; name: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
        {code ?? '?'}
      </div>
      <span className="text-center text-sm font-semibold text-gray-900">{name}</span>
    </div>
  )
}

export default function GuessCard({
  match,
  onPick,
  onSkip,
  remaining,
}: {
  match: Match
  onPick: (choice: Choice) => void
  onSkip: () => void
  remaining: number
}) {
  const isGroup = match.stage === 'group'
  const btn =
    'rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-800 transition-colors hover:border-amber-400 hover:bg-amber-50 active:scale-[0.98]'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
          {matchLabel(match)}
        </span>
        <span>{kickoffLabel(match.kickoff)}（北京时间）</span>
      </div>

      <div className="mb-5 flex items-center justify-between gap-2">
        <TeamPill code={match.home.code} name={match.home.name} />
        <span className="text-sm font-bold text-gray-300">VS</span>
        <TeamPill code={match.away.code} name={match.away.name} />
      </div>

      {isGroup ? (
        <div className="grid grid-cols-3 gap-2">
          <button className={btn} onClick={() => onPick('home')}>
            {match.home.name}胜
          </button>
          <button className={btn} onClick={() => onPick('draw')}>
            平局
          </button>
          <button className={btn} onClick={() => onPick('away')}>
            {match.away.name}胜
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button className={btn} onClick={() => onPick('home')}>
            {match.home.name}晋级
          </button>
          <button className={btn} onClick={() => onPick('away')}>
            {match.away.name}晋级
          </button>
        </div>
      )}

      <button
        onClick={onSkip}
        disabled={remaining <= 1}
        className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40"
      >
        跳过这场 · 还有 {remaining} 场可猜
      </button>
    </div>
  )
}
