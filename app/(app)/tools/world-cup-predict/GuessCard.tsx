'use client'

import type { Choice, Match } from '@/lib/world-cup/types'
import { matchLabel, kickoffLabel } from '@/lib/world-cup/labels'
import Flag from '@/components/world-cup/Flag'

function TeamBlock({ code, name }: { code: string | null; name: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <Flag code={code} className="h-16 w-16 rounded-2xl shadow-md ring-1 ring-black/5 md:h-20 md:w-20" />
      <span className="text-center text-base font-extrabold leading-tight text-gray-900 md:text-xl">
        {name}
      </span>
    </div>
  )
}

function PickButton({
  onClick,
  selected,
  tone,
  children,
}: {
  onClick: () => void
  selected: boolean
  tone: 'home' | 'draw' | 'away'
  children: React.ReactNode
}) {
  const tones = {
    home: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100',
    draw: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100',
    away: 'border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400 hover:bg-sky-100',
  }
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-4 transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
        selected ? 'border-amber-400 bg-amber-100 text-amber-900 ring-4 ring-amber-200' : tones[tone]
      }`}
    >
      {children}
      {selected && (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-sm text-white shadow">
          ✓
        </span>
      )}
    </button>
  )
}

export default function GuessCard({
  match,
  onPick,
  onSkip,
  remaining,
  selected,
}: {
  match: Match
  onPick: (choice: Choice) => void
  onSkip: () => void
  remaining: number
  selected: Choice | null
}) {
  const isGroup = match.stage === 'group'

  return (
    <div className="w-full rounded-3xl bg-white p-5 shadow-2xl md:p-8">
      <div className="mb-5 flex items-center justify-between text-xs">
        <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-700">
          {matchLabel(match)}
        </span>
        <span className="text-gray-400">{kickoffLabel(match.kickoff)}（北京时间）</span>
      </div>

      <div className="mb-7 flex items-center justify-between gap-3">
        <TeamBlock code={match.home.code} name={match.home.name} />
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-black text-white shadow-lg">
          VS
        </div>
        <TeamBlock code={match.away.code} name={match.away.name} />
      </div>

      {isGroup ? (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <PickButton onClick={() => onPick('home')} selected={selected === 'home'} tone="home">
            <Flag code={match.home.code} className="h-7 w-7 rounded-md" />
            <span className="text-xs font-bold md:text-sm">{match.home.name}胜</span>
          </PickButton>
          <PickButton onClick={() => onPick('draw')} selected={selected === 'draw'} tone="draw">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-200 text-sm font-black">
              =
            </span>
            <span className="text-xs font-bold md:text-sm">平局</span>
          </PickButton>
          <PickButton onClick={() => onPick('away')} selected={selected === 'away'} tone="away">
            <Flag code={match.away.code} className="h-7 w-7 rounded-md" />
            <span className="text-xs font-bold md:text-sm">{match.away.name}胜</span>
          </PickButton>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <PickButton onClick={() => onPick('home')} selected={selected === 'home'} tone="home">
            <Flag code={match.home.code} className="h-8 w-8 rounded-md" />
            <span className="text-sm font-bold">{match.home.name}晋级</span>
          </PickButton>
          <PickButton onClick={() => onPick('away')} selected={selected === 'away'} tone="away">
            <Flag code={match.away.code} className="h-8 w-8 rounded-md" />
            <span className="text-sm font-bold">{match.away.name}晋级</span>
          </PickButton>
        </div>
      )}

      <button
        onClick={onSkip}
        disabled={remaining <= 1 || selected != null}
        className="mt-4 w-full text-center text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40"
      >
        跳过这场 · 还有 {remaining} 场可猜
      </button>
    </div>
  )
}
