'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Share2, ArrowRight } from 'lucide-react'
import type { Predictions, WorldCupData } from '@/lib/world-cup/types'
import { computeStats } from '@/lib/world-cup/scoring'
import StatsBar from './StatsBar'
import AccuracyBadge from '@/components/world-cup/AccuracyBadge'
import BracketTree from '@/components/world-cup/BracketTree'
import SharePoster from '@/components/world-cup/SharePoster'

export default function DashboardClient({ data }: { data: WorldCupData }) {
  const [predictions, setPredictions] = useState<Predictions>({})
  const [ready, setReady] = useState(false)
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/world-cup/me')
      .then((r) => r.json())
      .then((d: { predictions?: Predictions }) => {
        if (alive) {
          setPredictions(d.predictions ?? {})
          setReady(true)
        }
      })
      .catch(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])

  const stats = useMemo(() => computeStats(predictions, data), [predictions, data])
  const hasPredictions = stats.predicted > 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.title}竞猜</h1>
          <p className="mt-1 text-sm text-gray-500">你的预测战绩与晋级树，随真实赛果每天更新</p>
        </div>
        <Link
          href="/wc"
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          {hasPredictions ? '继续竞猜' : '开始竞猜'}
          <ArrowRight size={16} />
        </Link>
      </header>

      <AccuracyBadge stats={stats} />

      <StatsBar stats={stats} />

      {/* Share */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">分享我的预测</p>
            <p className="text-xs text-gray-500">生成战报图与专属链接，朋友也能来猜</p>
          </div>
          <button
            onClick={() => setShowShare((s) => !s)}
            disabled={!hasPredictions}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Share2 size={16} />
            {showShare ? '收起' : '生成战报图'}
          </button>
        </div>
        {showShare && hasPredictions && (
          <div className="mt-4">
            <SharePoster data={data} predictions={predictions} stats={stats} />
          </div>
        )}
        {ready && !hasPredictions && (
          <p className="mt-3 text-xs text-gray-400">
            还没有预测。
            <Link href="/wc" className="text-amber-600 hover:underline">
              去猜几场
            </Link>
            后再来分享。
          </p>
        )}
      </div>

      {/* Bracket */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">我的预测全景</h2>
        <BracketTree data={data} predictions={predictions} />
      </div>
    </div>
  )
}
