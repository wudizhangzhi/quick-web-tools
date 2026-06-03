'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Share2, Check, ArrowRight } from 'lucide-react'
import type { Choice, Predictions, WorldCupData } from '@/lib/world-cup/types'
import { computeStats } from '@/lib/world-cup/scoring'
import { event as gaEvent } from '@/lib/gtag'
import StatsBar from './StatsBar'
import BracketTree from '@/components/world-cup/BracketTree'

export default function DashboardClient({ data }: { data: WorldCupData }) {
  const [predictions, setPredictions] = useState<Predictions>({})
  const [ready, setReady] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)

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

  async function share() {
    setSharing(true)
    try {
      const res = await fetch('/api/world-cup/share', { method: 'POST' })
      const d = (await res.json()) as { code?: string }
      if (res.ok && d.code) {
        const url = `${window.location.origin}/p/${d.code}`
        setShareUrl(url)
        try {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          /* clipboard blocked — url still shown for manual copy */
        }
        gaEvent('wc_share', { status: 'copy_link' })
      }
    } catch {
      /* ignore — retryable */
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.title}竞猜</h1>
          <p className="mt-1 text-sm text-gray-500">你的预测战绩与晋级树，随真实赛果每天更新</p>
        </div>
        <Link
          href="/wc"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          {hasPredictions ? '继续竞猜' : '开始竞猜'}
          <ArrowRight size={16} />
        </Link>
      </header>

      <StatsBar stats={stats} />

      {/* Share */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">分享我的预测</p>
            <p className="text-xs text-gray-500">生成专属晋级树链接，朋友也能来猜</p>
          </div>
          <button
            onClick={share}
            disabled={!hasPredictions || sharing}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? '已复制' : sharing ? '生成中…' : '分享'}
          </button>
        </div>
        {shareUrl && (
          <div className="mt-3 break-all rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">{shareUrl}</div>
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
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">晋级树</h2>
        <BracketTree data={data} predictions={predictions} />
      </div>
    </div>
  )
}
