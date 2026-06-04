import type { Stats } from '@/lib/world-cup/scoring'

function Cell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-gray-50 px-2 py-3">
      <span className="text-lg font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

export default function StatsBar({ stats }: { stats: Stats }) {
  const pct = stats.resolved > 0 ? `${Math.round(stats.accuracy * 100)}%` : '—'
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Cell label="已猜" value={stats.predicted} />
      <Cell label="已出结果" value={stats.resolved} />
      <Cell label="猜对" value={stats.correct} />
      <Cell label="正确率" value={pct} />
    </div>
  )
}
