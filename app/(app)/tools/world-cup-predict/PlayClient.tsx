'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { Trophy, ArrowRight } from 'lucide-react'
import type { Choice, Predictions, WorldCupData } from '@/lib/world-cup/types'
import { event as gaEvent } from '@/lib/gtag'
import GuessCard from './GuessCard'

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
    setTimeout(() => {
      setPredictions((p) => ({ ...p, [id]: choice }))
      setQueue((q) => q.slice(1))
      setSelected(null)
    }, 550)
  }

  function skip() {
    if (selected) return
    setQueue((q) => (q.length > 1 ? [...q.slice(1), q[0]] : q))
  }

  return (
    <div className="relative min-h-[78vh] overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-700 to-green-900 px-4 py-6 shadow-xl md:px-8 md:py-10">
      {/* decorative glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-lime-300/20 blur-3xl" />
      <Trophy className="pointer-events-none absolute -bottom-6 right-2 text-white/5" size={180} strokeWidth={1} />

      <div className="relative z-10 mb-6 flex items-center justify-between gap-3 text-white">
        <div>
          <h1 className="text-lg font-black leading-tight md:text-2xl">{data.title}竞猜</h1>
          <p className="mt-0.5 text-xs text-white/70 md:text-sm">
            已猜 <b className="text-amber-300">{predictedCount}</b> 场 · 选出你心中的胜者
          </p>
        </div>
        <Link
          href="/tools/world-cup-predict"
          className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25 md:text-sm"
        >
          我的晋级树
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="relative z-10 mx-auto flex max-w-md flex-col justify-center">
        {!ready ? (
          <div className="rounded-3xl bg-white/10 p-10 text-center text-sm text-white/80 backdrop-blur">
            加载中…
          </div>
        ) : current ? (
          <GuessCard
            match={current}
            onPick={pick}
            onSkip={skip}
            remaining={queue.length}
            selected={selected}
          />
        ) : (
          <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
            <Trophy className="mx-auto mb-3 text-amber-500" size={36} />
            <p className="text-base font-bold text-gray-800">你已经猜完所有可以预测的比赛 🎉</p>
            <p className="mt-1 text-xs text-gray-400">等淘汰赛对阵确定后回来继续补猜</p>
            <Link
              href="/tools/world-cup-predict"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              查看我的晋级树
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
