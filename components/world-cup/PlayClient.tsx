'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { Trophy, ArrowLeft, ArrowRight, Share2, X } from 'lucide-react'
import type { Choice, Predictions, WorldCupData } from '@/lib/world-cup/types'
import { computeStats } from '@/lib/world-cup/scoring'
import { event as gaEvent } from '@/lib/gtag'
import GuessCard from './GuessCard'
import SharePoster from './SharePoster'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function PlayClient({ data }: { data: WorldCupData }) {
  const [predictions, setPredictions] = useState<Predictions>({})
  const [queue, setQueue] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState<Choice | null>(null)
  const [showShare, setShowShare] = useState(false)

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

  const byId = new Map(data.matches.map((m) => [m.id, m]))
  const current = queue[0] ? byId.get(queue[0]) : undefined
  const predictedCount = Object.keys(predictions).length

  function pick(choice: Choice) {
    if (!current || selected) return
    const id = current.id
    setSelected(choice)
    confetti({ particleCount: 50, spread: 65, startVelocity: 32, origin: { y: 0.55 }, scalar: 0.9 })
    gaEvent('wc_predict', { stage: current.stage, choice })
    fetch('/api/world-cup/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: id, choice }),
    }).catch(() => {})
    // Hold long enough for the flag charge + explosion to play out before advancing.
    setTimeout(() => {
      setPredictions((p) => ({ ...p, [id]: choice }))
      setQueue((q) => q.slice(1))
      setSelected(null)
    }, 950)
  }

  function skip() {
    if (selected) return
    setQueue((q) => (q.length > 1 ? [...q.slice(1), q[0]] : q))
  }

  const stats = useMemo(() => computeStats(predictions, data), [predictions, data])

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-700 to-green-900">
      {/* decorative background */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-lime-300/20 blur-3xl" />
      <Trophy
        className="pointer-events-none absolute -bottom-10 -right-6 text-white/[0.06]"
        size={280}
        strokeWidth={1}
      />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-5 text-white md:px-6">
        <Link
          href="/tools/world-cup-predict"
          className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/25"
        >
          <ArrowLeft size={14} />
          我的晋级树
        </Link>
        <div className="flex items-center gap-2">
          {predictedCount > 0 && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-emerald-950 shadow-sm transition-colors hover:bg-amber-300"
            >
              <Share2 size={14} />
              分享战绩
            </button>
          )}
          <div className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            已猜 <b className="text-amber-300">{predictedCount}</b> 场
          </div>
        </div>
      </header>

      {/* title */}
      <div className="relative z-10 px-4 pt-7 text-center text-white md:pt-9">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">{data.title}竞猜</h1>
        <p className="mt-1.5 text-sm text-white/70">选出你心中的胜者，每天更新真实赛果</p>
      </div>

      {/* centered card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          {!ready ? (
            <div className="rounded-3xl bg-white/10 p-12 text-center text-sm text-white/80 backdrop-blur">
              加载中…
            </div>
          ) : current ? (
            <GuessCard
              key={current.id}
              match={current}
              onPick={pick}
              onSkip={skip}
              remaining={queue.length}
              selected={selected}
            />
          ) : (
            <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
              <Trophy className="mx-auto mb-3 text-amber-500" size={40} />
              <p className="text-lg font-bold text-gray-800">全部猜完啦 🎉</p>
              <p className="mt-1 text-sm text-gray-400">等淘汰赛对阵确定后回来继续补猜</p>
              <Link
                href="/tools/world-cup-predict"
                className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                查看我的晋级树
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* share overlay */}
      {showShare && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowShare(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowShare(false)}
              aria-label="关闭"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={18} />
            </button>
            <h2 className="mb-4 text-center text-base font-bold text-gray-900">分享我的战报</h2>
            <SharePoster data={data} predictions={predictions} stats={stats} />
          </div>
        </div>
      )}
    </div>
  )
}
