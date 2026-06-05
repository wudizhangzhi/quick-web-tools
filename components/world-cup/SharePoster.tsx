'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download, Copy, Link2, Check, ImageIcon } from 'lucide-react'
import type { Predictions, WorldCupData } from '@/lib/world-cup/types'
import type { Stats } from '@/lib/world-cup/scoring'
import { championPick } from '@/lib/world-cup/champion'
import { event as gaEvent } from '@/lib/gtag'
import { canCopyImage, copyBlobToClipboard, downloadBlob, nodeToPngBlob } from '@/lib/share-image'
import ShareCard from './ShareCard'

type Hint = 'saved' | 'copied_image' | 'copied_link' | null

// Self-contained share panel (plan B): lazily mints a /p/[code] link, renders the
// poster preview, and exposes save / copy-image / copy-link actions. Mounted only
// when the user opens "share", so we don't burn share codes on every page view.
export default function SharePoster({
  data,
  predictions,
  stats,
}: {
  data: WorldCupData
  predictions: Predictions
  stats: Stats
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<Hint>(null)

  const champion = useMemo(() => championPick(predictions, data), [predictions, data])
  const host = url ? new URL(url).host : ''
  const copyImageSupported = canCopyImage()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/world-cup/share', { method: 'POST' })
        const d = (await res.json()) as { code?: string }
        if (!alive) return
        if (!res.ok || !d.code) {
          setFailed(true)
          return
        }
        const link = `${window.location.origin}/p/${d.code}`
        setUrl(link)
        const dataUrl = await QRCode.toDataURL(link, { margin: 1, width: 160 })
        if (alive) setQr(dataUrl)
      } catch {
        if (alive) setFailed(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  function flash(h: Exclude<Hint, null>) {
    setHint(h)
    setTimeout(() => setHint((cur) => (cur === h ? null : cur)), 2000)
  }

  async function withCard(action: (blob: Blob) => Promise<void> | void) {
    if (!cardRef.current || busy) return
    setBusy(true)
    try {
      const blob = await nodeToPngBlob(cardRef.current)
      await action(blob)
    } catch {
      /* surface nothing destructive — user can retry */
    } finally {
      setBusy(false)
    }
  }

  function save() {
    return withCard((blob) => {
      downloadBlob(blob, '世界杯预测战报.png')
      gaEvent('wc_share', { status: 'save_image' })
      flash('saved')
    })
  }

  function copyImage() {
    return withCard(async (blob) => {
      await copyBlobToClipboard(blob)
      gaEvent('wc_share', { status: 'copy_image' })
      flash('copied_image')
    })
  }

  async function copyLink() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      gaEvent('wc_share', { status: 'copy_link' })
      flash('copied_link')
    } catch {
      /* clipboard blocked — link is shown below for manual copy */
    }
  }

  if (failed) {
    return <p className="text-sm text-gray-500">生成分享图失败,请稍后重试。</p>
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* preview — scaled down; the screenshot targets the full-size card via ref */}
      <div className="h-[360px] w-[270px] overflow-hidden rounded-2xl shadow-lg">
        <div className="origin-top-left scale-[0.75]">
          <ShareCard
            ref={cardRef}
            title={data.title}
            stats={stats}
            champion={champion}
            qrDataUrl={qr}
            host={host}
          />
        </div>
      </div>

      <div className="flex w-full max-w-[280px] flex-col gap-2">
        <button
          onClick={save}
          disabled={busy || !url}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hint === 'saved' ? <Check size={16} /> : <Download size={16} />}
          {hint === 'saved' ? '已保存' : busy ? '生成中…' : '保存图片'}
        </button>

        {copyImageSupported && (
          <button
            onClick={copyImage}
            disabled={busy || !url}
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {hint === 'copied_image' ? <Check size={16} /> : <Copy size={16} />}
            {hint === 'copied_image' ? '已复制图片' : '复制图片'}
          </button>
        )}

        <button
          onClick={copyLink}
          disabled={!url}
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hint === 'copied_link' ? <Check size={16} /> : <Link2 size={16} />}
          {hint === 'copied_link' ? '已复制链接' : '复制链接'}
        </button>
      </div>

      {url && (
        <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <ImageIcon size={12} /> 保存到相册即可发朋友圈 / 小红书
        </p>
      )}
    </div>
  )
}
