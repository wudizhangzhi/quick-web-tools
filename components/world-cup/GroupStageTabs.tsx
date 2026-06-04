'use client'

import { useState } from 'react'
import type { Choice, Match, Team, WorldCupData } from '@/lib/world-cup/types'
import Flag from './Flag'

function teamName(t: Team): string {
  return t.placeholder != null ? '待定' : t.name
}

function GroupMatchRow({ match, pick }: { match: Match; pick?: Choice }) {
  const resolved = match.result != null
  const hasPick = pick != null
  const correct = resolved && hasPick && match.result === pick
  const wrong = resolved && hasPick && match.result !== pick

  const sideTone = (side: 'home' | 'away') => {
    const won = match.result === side
    const picked = pick === side
    if (resolved && won) return 'font-bold text-green-700'
    if (resolved && picked && !won) return 'text-red-400'
    if (picked) return 'font-semibold text-amber-700'
    return 'text-gray-700'
  }

  // Whole-row tint so a hit/miss reads at a glance.
  let rowTone = 'bg-white'
  if (correct) rowTone = 'bg-green-50 ring-1 ring-green-300'
  else if (wrong) rowTone = 'bg-red-50 ring-1 ring-red-200'
  else if (hasPick) rowTone = 'bg-amber-50 ring-1 ring-amber-200'

  let center: React.ReactNode
  if (resolved) {
    const label = match.result === 'home' ? '胜' : match.result === 'away' ? '负' : '平'
    const labelTone =
      match.result === 'draw' ? 'bg-gray-200 text-gray-600' : 'bg-emerald-600 text-white'
    center = (
      <span className="inline-flex items-center gap-1">
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${labelTone}`}>{label}</span>
        {hasPick &&
          (correct ? (
            <span className="text-sm font-bold text-green-600">✓</span>
          ) : (
            <span className="text-sm font-bold text-red-500">✗</span>
          ))}
      </span>
    )
  } else if (hasPick) {
    const label = pick === 'home' ? '猜胜' : pick === 'away' ? '猜负' : '猜平'
    center = (
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
        {label}
      </span>
    )
  } else {
    center = <span className="text-xs text-gray-300">vs</span>
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${rowTone}`}>
      <div className={`flex min-w-0 flex-1 items-center justify-end gap-1.5 ${sideTone('home')}`}>
        <span className="truncate">{teamName(match.home)}</span>
        <Flag code={match.home.code} className="h-4 w-6 shrink-0 rounded-[2px]" />
      </div>
      <div className="flex w-14 shrink-0 items-center justify-center">{center}</div>
      <div className={`flex min-w-0 flex-1 items-center gap-1.5 ${sideTone('away')}`}>
        <Flag code={match.away.code} className="h-4 w-6 shrink-0 rounded-[2px]" />
        <span className="truncate">{teamName(match.away)}</span>
      </div>
    </div>
  )
}

// One group at a time, picked via tabs. Defaults to the first group the user has
// actually predicted, so their own picks are front-and-centre; any group is a tap away.
export default function GroupStageTabs({
  data,
  predictions,
}: {
  data: WorldCupData
  predictions: Record<string, Choice>
}) {
  const groupMatches = data.matches.filter((m) => m.stage === 'group')
  const groups = Array.from(
    new Set(groupMatches.map((m) => m.group).filter((g): g is string => g != null)),
  ).sort()

  const pickCount = (g: string) =>
    groupMatches.filter((m) => m.group === g && predictions[m.id] != null).length

  const firstPlayed = groups.find((g) => pickCount(g) > 0)
  const [selected, setSelected] = useState<string>(firstPlayed ?? groups[0] ?? '')

  if (groups.length === 0) return null

  const ms = groupMatches
    .filter((m) => m.group === selected)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))

  // Keep the active group pinned to the front so it's always visible without scrolling.
  const orderedGroups = [selected, ...groups.filter((g) => g !== selected)]

  return (
    <div>
      {/* group selector */}
      <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {orderedGroups.map((g) => {
          const n = pickCount(g)
          const active = g === selected
          return (
            <button
              key={g}
              onClick={() => setSelected(g)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g} 组
              {n > 0 && (
                <span
                  className={`ml-1 rounded-full px-1 text-[10px] ${
                    active ? 'bg-white/25 text-white' : 'bg-amber-400 text-white'
                  }`}
                >
                  {n}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* selected group's matches */}
      <div className="space-y-1.5">
        {ms.map((m) => (
          <GroupMatchRow key={m.id} match={m} pick={predictions[m.id]} />
        ))}
      </div>
    </div>
  )
}
