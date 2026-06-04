import type { Choice, Match, Stage, WorldCupData } from '@/lib/world-cup/types'
import { stageLabel } from '@/lib/world-cup/labels'
import GroupStageTabs from './GroupStageTabs'
import KnockoutTabs from './KnockoutTabs'
import MatchNode from './MatchNode'

const ROUND_STAGES: Stage[] = ['r32', 'r16', 'qf', 'sf', 'final']

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
    <div className="space-y-6">
      <section>
        <h3 className="mb-2.5 text-sm font-semibold text-gray-700">小组赛</h3>
        <GroupStageTabs data={data} predictions={predictions} />
      </section>

      <section>
        <h3 className="mb-2.5 text-sm font-semibold text-gray-700">淘汰赛晋级树</h3>

        {/* Mobile: pick a round up top, its matches list below (like the groups). */}
        <div className="md:hidden">
          <KnockoutTabs data={data} predictions={predictions} />
        </div>

        {/* Desktop: one connected left→right bracket with CSS connector lines so it
            reads as a tree (see .wc-bracket in globals.css), filling the card width.
            Wrapped in overflow-x-auto so narrow desktop/tablet widths scroll rather
            than overflow the card. */}
        <div className="hidden overflow-x-auto pb-1 md:block">
          <div className="wc-bracket mb-1.5">
            {rounds.map((r) => (
              <div
                key={r.stage}
                className="min-w-[7.5rem] flex-1 text-center text-[11px] font-semibold text-gray-500"
              >
                {stageLabel(r.stage)}
              </div>
            ))}
          </div>
          <div className="wc-bracket">
            {rounds.map((r) => (
              <div key={r.stage} className="wc-bk-col">
                {r.matches.map((m) => (
                  <div key={m.id} className="wc-bk-item">
                    <div className="wc-bk-node">
                      <MatchNode match={m} pick={predictions[m.id]} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {third && (
            <div className="mt-4 flex items-center gap-3">
              <span className="shrink-0 text-[11px] font-semibold text-gray-500">季军战</span>
              <div className="w-44">
                <MatchNode match={third} pick={predictions[third.id]} />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
