'use client'

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import type { Choice, Match, Stage, Team, WorldCupData } from '@/lib/world-cup/types'
import { stageLabel } from '@/lib/world-cup/labels'
import MatchNode from './MatchNode'

const KO_STAGES: Stage[] = ['r32', 'r16', 'qf', 'sf', 'final', 'third']
// The linear progression; each round's pair p feeds the next round's match p.
const KO_ORDER: Stage[] = ['r32', 'r16', 'qf', 'sf', 'final']

function teamName(t: Team): string {
  return t.placeholder != null ? '待定' : t.name
}

// A match card tagged with its position number in the round, so the connector
// chips ("→ 8 强 #2") can be traced to the matching card in the next round's tab.
function Numbered({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute -left-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-gray-700 text-[9px] font-bold text-white">
        {n}
      </span>
      {children}
    </div>
  )
}

// Mobile knockout view: pick a round up top (32 强 / 16 强 / …), its matches list
// below. To keep the bracket legible, matches are paired with a converging
// connector that points at the next-round match they feed — so the progression
// tree is still readable without the wide horizontal bracket. Defaults to the
// first round the user has predicted; rounds stay in tournament order.
export default function KnockoutTabs({
  data,
  predictions,
}: {
  data: WorldCupData
  predictions: Record<string, Choice>
}) {
  const byStage = (stage: Stage): Match[] =>
    data.matches.filter((m) => m.stage === stage).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))

  const rounds = KO_STAGES.map((stage) => ({ stage, matches: byStage(stage) })).filter(
    (r) => r.matches.length > 0,
  )

  const pickCount = (matches: Match[]) => matches.filter((m) => predictions[m.id] != null).length

  const firstPlayed = rounds.find((r) => pickCount(r.matches) > 0)?.stage
  const [selected, setSelected] = useState<Stage>(firstPlayed ?? rounds[0]?.stage ?? 'r32')

  if (rounds.length === 0) return null

  const current = rounds.find((r) => r.stage === selected) ?? rounds[0]
  const nextStage =
    KO_ORDER[KO_ORDER.indexOf(current.stage) + 1] /* undefined for final & third */
  const ms = current.matches

  return (
    <div>
      {/* round selector */}
      <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {rounds.map((r) => {
          const n = pickCount(r.matches)
          const active = r.stage === current.stage
          return (
            <button
              key={r.stage}
              onClick={() => setSelected(r.stage)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {stageLabel(r.stage)}
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

      {/* selected round's matches */}
      {nextStage ? (
        <div className="space-y-3">
          {Array.from({ length: Math.ceil(ms.length / 2) }, (_, p) => {
            const pair = ms.slice(p * 2, p * 2 + 2)
            return (
              <div key={p} className="flex items-stretch gap-1.5">
                <div className="flex flex-1 flex-col justify-center gap-2">
                  {pair.map((m, k) => (
                    <Numbered key={m.id} n={p * 2 + k + 1}>
                      <MatchNode match={m} pick={predictions[m.id]} size="md" />
                    </Numbered>
                  ))}
                </div>
                {/* converging connector → the next-round match this pair feeds */}
                <div className="flex w-16 shrink-0 items-center">
                  <div className="h-1/2 w-2.5 shrink-0 rounded-r-md border-y-2 border-r-2 border-gray-300" />
                  <span className="ml-1 rounded bg-gray-100 px-1.5 py-1 text-center text-[10px] font-semibold leading-tight text-gray-500">
                    {stageLabel(nextStage)}
                    <span className="block">#{p + 1}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : current.stage === 'final' ? (
        <div className="space-y-2">
          <MatchNode match={ms[0]} pick={predictions[ms[0].id]} size="md" />
          {ms[0].result != null && (
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 py-2 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
              <Trophy size={16} className="text-amber-500" />
              冠军：{teamName(ms[0].result === 'away' ? ms[0].away : ms[0].home)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {ms.map((m) => (
            <MatchNode key={m.id} match={m} pick={predictions[m.id]} size="md" />
          ))}
        </div>
      )}
    </div>
  )
}
