'use client'

import { useEffect, useMemo, useState } from 'react'
import { Share2, Check, Trophy } from 'lucide-react'
import type { Choice, Predictions, WorldCupData } from '@/lib/world-cup/types'
import { computeStats } from '@/lib/world-cup/scoring'
import { event as gaEvent } from '@/lib/gtag'
import GuessCard from './GuessCard'
import StatsBar from './StatsBar'
import BracketTree from '@/components/world-cup/BracketTree'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function WorldCupClient({ data }: { data: WorldCupData }) {
  const [predictions, setPredictions] = useState<Predictions>({})
  const [queue, setQueue] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    const now = Date.now()
    fetch('/api/world-cup/me')
      .then((r) => r.json())
      .then((d: { predictions?: Predictions }) => {
        if (!alive) return
        const preds = d.predictions ?? {}
        setPredictions(preds)
        const pool = data.matches
          .filter(
            (m) =>
              m.home.placeholder == null &&
              m.away.placeholder == null &&
              new Date(m.kickoff).getTime() > now &&
              !(m.id in preds),
          )
          .map((m) => m.id)
        setQueue(shuffle(pool))
        setReady(true)
      })
      .catch(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [data])

  const stats = useMemo(() => computeStats(predictions, data), [predictions, data])
  const byId = useMemo(() => new Map(data.matches.map((m) => [m.id, m])), [data])
  const current = queue[0] ? byId.get(queue[0]) : undefined

  function pick(choice: Choice) {
    if (!current) return
    const id = current.id
    setPredictions((p) => ({ ...p, [id]: choice }))
    setQueue((q) => q.slice(1))
    gaEvent('wc_predict', { stage: current.stage, choice })
    fetch('/api/world-cup/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: id, choice }),
    }).catch(() => {})
  }

  function skip() {
    setQueue((q) => (q.length > 1 ? [...q.slice(1), q[0]] : q))
  }

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
          /* clipboard blocked — url is still shown for manual copy */
        }
        gaEvent('wc_share', { status: 'copy_link' })
      }
    } catch {
      /* ignore — button can be retried */
    } finally {
      setSharing(false)
    }
  }

  const hasPredictions = stats.predicted > 0

  return (
    <div className="space-y-6">
      <StatsBar stats={stats} />

      {!ready ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          加载中…
        </div>
      ) : current ? (
        <GuessCard match={current} onPick={pick} onSkip={skip} remaining={queue.length} />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <Trophy className="mx-auto mb-2 text-amber-500" size={28} />
          <p className="text-sm font-medium text-gray-700">你已经猜完所有可以预测的比赛 🎉</p>
          <p className="mt-1 text-xs text-gray-400">等淘汰赛对阵确定后，回来继续补猜</p>
        </div>
      )}

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
          <div className="mt-3 break-all rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            {shareUrl}
          </div>
        )}
        {!hasPredictions && (
          <p className="mt-3 text-xs text-gray-400">先猜至少一场，才能生成分享链接</p>
        )}
      </div>

      {/* Bracket */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">我的晋级树</h2>
        <BracketTree data={data} predictions={predictions} />
      </div>
    </div>
  )
}
