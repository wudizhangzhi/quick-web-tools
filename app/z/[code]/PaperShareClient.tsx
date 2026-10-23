'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Stamp, PenLine, Trash2, Share2, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { event as gaEvent } from '@/lib/gtag'
import { downloadBlob } from '@/lib/share-image'
import type { PaperConfig } from '@/lib/paper-desk/config'
import type { Decision } from '@/lib/paper-desk/store'
import { usePaperScene } from '@/components/paper-desk/usePaperScene'
import ZoomControls from '@/components/paper-desk/ZoomControls'
import SoundToggle from '@/components/paper-desk/SoundToggle'

type Result = { decision: Decision; at: number }
type Props = { code: string; cfg: PaperConfig; initial: Result | null }

function fmt(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// The 3D snapshot plus a caption strip, so the image explains itself when forwarded.
async function resultImage(shot: Blob, cfg: PaperConfig, r: Result): Promise<Blob | null> {
  const img = await createImageBitmap(shot)
  const band = Math.round(img.width * 0.13)
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height + band
  const g = c.getContext('2d')!
  g.drawImage(img, 0, 0)
  g.fillStyle = r.decision === 'approved' ? '#7f0d1f' : '#1f2125'
  g.fillRect(0, img.height, c.width, band)
  const title = cfg.title.trim() ? `《${cfg.title.trim()}》` : '这张纸'
  const verdict = r.decision === 'approved' ? '已批准' : '已驳回，送进了碎纸机'
  g.fillStyle = '#fff'
  g.textBaseline = 'middle'
  g.font = `700 ${Math.round(band * 0.3)}px "Noto Serif SC", "Songti SC", serif`
  g.fillText(`${title}${verdict}`, band * 0.35, img.height + band * 0.38, c.width - band * 0.7)
  g.fillStyle = 'rgba(255,255,255,.7)'
  g.font = `500 ${Math.round(band * 0.17)}px "Noto Sans SC", "PingFang SC", sans-serif`
  g.fillText(`${fmt(r.at)} · 桌上的纸`, band * 0.35, img.height + band * 0.72)
  return new Promise((resolve) => c.toBlob(resolve, 'image/png'))
}

export default function PaperShareClient({ code, cfg, initial }: Props) {
  const holderRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<Result | null>(initial)
  const [busy, setBusy] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [hint, setHint] = useState(true)
  const [landed, setLanded] = useState(false)
  const { sceneRef, sfxRef, ready, error } = usePaperScene(holderRef, cfg, true, {
    stamped: initial?.decision === 'approved',
    shredded: initial?.decision === 'rejected',
    dropIn: !initial,
    padBottom: 0.3,
    margin: 0.12,
  })

  // buttons and hints wait until the sheet has landed on the desk
  useEffect(() => {
    if (!ready) return
    let alive = true
    sceneRef.current?.whenLanded().then(() => alive && setLanded(true))
    return () => {
      alive = false
    }
  }, [ready, sceneRef])

  // the gesture hint sits over the top of the sheet — show it briefly, then get out of the way
  useEffect(() => {
    if (!landed) return
    const t = setTimeout(() => setHint(false), 4000)
    return () => clearTimeout(t)
  }, [landed])

  const decide = async (decision: Decision) => {
    const scene = sceneRef.current
    if (busy || result || !scene) return
    sfxRef.current?.unlock() // the click is the gesture that lets audio start
    setBusy(true)
    // play the moment first — it matters more than the round trip
    const anim = decision === 'approved' ? scene.stamp() : scene.shred()
    try {
      const res = await fetch(`/api/paper-desk/${code}/decide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `http_${res.status}`)
      await anim
      setResult({ decision: data.decision ?? decision, at: data.at ?? Date.now() })
      if (decision === 'approved') {
        sfxRef.current?.chime()
        navigator.vibrate?.(60)
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ['#c8102e', '#ffd166', '#ffffff'] })
      }
      gaEvent('paper_desk_decide', { status: decision })
    } catch (e) {
      await anim
      if (decision === 'approved') scene.setStamped(false)
      gaEvent('paper_desk_decide', { status: 'fail', error: e instanceof Error ? e.message : 'unknown' })
    } finally {
      setBusy(false)
    }
  }

  const shareResult = async () => {
    const shot = await sceneRef.current?.snapshot()
    if (!shot || !result) return
    setSharing(true)
    try {
      const blob = await resultImage(shot, cfg, result)
      if (!blob) return
      const file = new File([blob], 'paper-result.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          gaEvent('paper_desk_share', { status: 'result_share' })
        } catch {
          // user closed the share sheet
        }
      } else {
        downloadBlob(blob, 'paper-result.png')
        gaEvent('paper_desk_share', { status: 'result_download' })
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#1a1410]">
      <style>{`@keyframes pd-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div ref={holderRef} className="absolute inset-0" />
      {!ready && !error && (
        <div className="absolute inset-0 grid place-items-center text-amber-100/80 text-sm tracking-widest">铺纸中…</div>
      )}
      {error && <div className="absolute inset-0 grid place-items-center text-red-200 text-sm px-6 text-center">{error}</div>}

      {landed && <SoundToggle sfx={sfxRef.current} className="absolute right-3 top-3" />}
      {landed && result?.decision !== 'rejected' && !(busy && !result) && (
        <ZoomControls scene={sceneRef.current} className="absolute right-3 top-1/2 -translate-y-1/2" />
      )}
      {landed && !initial && (
        <div
          className={`pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/35 px-3 py-1 text-[11px] text-amber-50/90 backdrop-blur transition-opacity duration-700 ${
            hint ? 'opacity-100' : 'opacity-0'
          }`}
        >
          双击或双指放大 · 拖纸角掀起来
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-[max(20px,env(safe-area-inset-bottom))]">
        {landed && cfg.stamp && !result && !busy && (
          <div className="flex items-center gap-3 animate-[pd-rise_.45s_ease-out]">
            <button
              type="button"
              onClick={() => decide('rejected')}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/90 px-5 py-3 text-base font-bold text-gray-800 shadow-lg shadow-black/40 transition active:scale-95 disabled:opacity-60"
            >
              <Trash2 size={18} /> 拒绝
            </button>
            <button
              type="button"
              onClick={() => decide('approved')}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#c8102e] px-6 py-3 text-base font-bold text-white shadow-lg shadow-black/40 transition active:scale-95 disabled:opacity-60"
            >
              <Stamp size={20} /> 批准
            </button>
          </div>
        )}
        {result && (
          <>
            <div className="rounded-full bg-black/45 px-4 py-1.5 text-xs text-amber-50 backdrop-blur">
              {result.decision === 'approved' ? `已于 ${fmt(result.at)} 批准` : `已于 ${fmt(result.at)} 驳回并粉碎`}
            </div>
            <button
              type="button"
              onClick={shareResult}
              disabled={sharing}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/40 transition active:scale-95 disabled:opacity-60"
            >
              {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} 分享结果图
            </button>
          </>
        )}
        <Link
          href="/tools/paper-desk"
          onClick={() => gaEvent('paper_desk_cta', { status: 'write_own' })}
          className="pointer-events-auto flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] text-amber-50/90 backdrop-blur hover:bg-white/25"
        >
          <PenLine size={12} /> 我也写一张
        </Link>
      </div>
    </div>
  )
}
