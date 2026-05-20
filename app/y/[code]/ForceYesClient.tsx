'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { findMeme } from '@/lib/force-yes/memes'
import {
  YES_SCALE_STEP,
  YES_SCALE_MAX,
  NO_FLEE_AFTER,
  NO_FLEE_MARGIN,
  pickNoMemeIndex,
  noCountBucket,
} from '@/lib/force-yes/constants'
import { event as gaEvent } from '@/lib/gtag'

type Props = {
  code: string
  isOwner: boolean
  yesText: string
  noText: string
  yesEffectText: string
  yesMeme: string
  noMemes: [string, string, string]
}

export default function ForceYesClient({
  code,
  isOwner,
  yesText,
  noText,
  yesEffectText,
  yesMeme,
  noMemes,
}: Props) {
  const [noCount, setNoCount] = useState(0)
  const [won, setWon] = useState(false)
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const noButtonRef = useRef<HTMLButtonElement>(null)
  const yesScale = useMemo(
    () => Math.min(YES_SCALE_MAX, Math.pow(YES_SCALE_STEP, noCount)),
    [noCount],
  )

  const currentNoMeme = useMemo(() => findMeme(noMemes[pickNoMemeIndex(noCount)]), [noMemes, noCount])
  const yesMemeDef = useMemo(() => findMeme(yesMeme), [yesMeme])

  const triggerNoFlee = useCallback(() => {
    if (typeof window === 'undefined') return
    const w = window.innerWidth
    const h = window.innerHeight
    const margin = Math.min(w, h) * NO_FLEE_MARGIN
    const rect = noButtonRef.current?.getBoundingClientRect()
    const btnW = rect?.width ?? 80
    const btnH = rect?.height ?? 40
    const maxX = Math.max(margin, w - margin - btnW)
    const maxY = Math.max(margin, h - margin - btnH)
    const x = margin + Math.random() * Math.max(0, maxX - margin)
    const y = margin + Math.random() * Math.max(0, maxY - margin)
    setNoPos({ x, y })
  }, [])

  const onNoEnter = useCallback(() => {
    if (noCount >= NO_FLEE_AFTER) triggerNoFlee()
  }, [noCount, triggerNoFlee])

  const onNoClick = useCallback(() => {
    if (noCount >= NO_FLEE_AFTER) {
      triggerNoFlee()
      return
    }
    setNoCount((c) => {
      const next = c + 1
      gaEvent('force_yes_choice', { status: 'no_clicked', no_count_bucket: noCountBucket(next) })
      return next
    })
  }, [noCount, triggerNoFlee])

  const onYesClick = useCallback(() => {
    setWon(true)
    gaEvent('force_yes_choice', { status: 'yes_clicked', no_count_bucket: noCountBucket(noCount) })
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.4 },
      colors: ['#FFD700', '#FFA500', '#FFFFFF', '#FFE066'],
    })
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate?.(200) } catch {}
    }
  }, [noCount])

  const copyLink = async () => {
    const url = `${window.location.origin}/y/${code}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-pink-50 to-white overflow-hidden">
      {isOwner && !won && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/80 px-4 py-2 text-xs shadow backdrop-blur z-10">
          你的专属链接：<code className="font-mono">/y/{code}</code>
          <button onClick={copyLink} className="ml-2 rounded bg-yellow-500 px-2 py-0.5 text-white">
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      )}

      {won ? (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div className="text-8xl animate-[pop_0.5s_ease-out]">{yesMemeDef?.emoji}</div>
          <div className="mt-6 max-w-xl text-2xl font-bold text-gray-800 whitespace-pre-wrap">{yesEffectText}</div>
          <style>{`
            @keyframes pop {
              0% { transform: scale(0); }
              60% { transform: scale(1.4); }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
          <div className="text-6xl">{currentNoMeme?.emoji}</div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <button
              type="button"
              onClick={onYesClick}
              style={{ transform: `scale(${yesScale})`, transformOrigin: 'center' }}
              className="rounded-2xl bg-yellow-500 px-8 py-4 text-xl font-bold text-white shadow-lg transition-transform duration-200 hover:bg-yellow-600"
            >
              {yesText}
            </button>
            <button
              ref={noButtonRef}
              type="button"
              onMouseEnter={onNoEnter}
              onTouchStart={onNoEnter}
              onClick={onNoClick}
              style={
                noPos
                  ? { position: 'fixed', left: noPos.x, top: noPos.y, transition: 'left 0.2s, top 0.2s' }
                  : undefined
              }
              className="rounded-2xl bg-gray-200 px-6 py-3 text-base text-gray-700 shadow hover:bg-gray-300"
            >
              {noText}
            </button>
          </div>
          {noCount > 0 && (
            <div className="text-xs text-gray-400">已经犹豫 {noCount} 次了哦</div>
          )}
        </div>
      )}
    </div>
  )
}
