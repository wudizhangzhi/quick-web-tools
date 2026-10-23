'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, CalendarDays, Share2, Copy, Check, ExternalLink, Loader2, RotateCcw } from 'lucide-react'
import TurnstileWidget from '@/components/TurnstileWidget'
import { event as gaEvent } from '@/lib/gtag'
import { downloadBlob } from '@/lib/share-image'
import {
  DEFAULT_CONFIG,
  DESKS,
  FONTS,
  INK_PRESETS,
  LIMITS,
  PAPER_STYLES,
  formatDate,
  isBlank,
  sanitizeConfig,
  type FontKey,
  type PaperConfig,
  type TextStyle,
} from '@/lib/paper-desk/config'
import { loadGlyphs, usePaperScene } from './usePaperScene'
import ZoomControls from './ZoomControls'
import SoundToggle from './SoundToggle'

const STORAGE_KEY = 'paper-desk:v2'

function Chips<K extends string>({
  value,
  options,
  onChange,
}: {
  value: K
  options: Record<K, { label: string }>
  onChange: (k: K) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(options) as K[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
            value === k
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
          }`}
        >
          {options[k].label}
        </button>
      ))}
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// font chips + ink swatches + free colour picker for one section of the letter
function StyleRow({ value, onChange }: { value: TextStyle; onChange: (s: TextStyle) => void }) {
  const isPreset = INK_PRESETS.some((p) => p.color === value.color)
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
      <select
        value={value.font}
        onChange={(e) => onChange({ ...value, font: e.target.value as FontKey })}
        className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs"
        aria-label="字体"
      >
        {(Object.keys(FONTS) as FontKey[]).map((k) => (
          <option key={k} value={k}>
            {FONTS[k].label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        {INK_PRESETS.map((p) => (
          <button
            key={p.color}
            type="button"
            title={p.label}
            aria-label={p.label}
            onClick={() => onChange({ ...value, color: p.color })}
            className={`h-5 w-5 rounded-full border-2 ${value.color === p.color ? 'border-gray-900' : 'border-white'} shadow-sm`}
            style={{ background: p.color }}
          />
        ))}
        <label
          title="自定义颜色"
          className={`relative h-5 w-5 cursor-pointer overflow-hidden rounded-full border-2 shadow-sm ${
            isPreset ? 'border-white' : 'border-gray-900'
          }`}
          style={{ background: isPreset ? 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' : value.color }}
        >
          <input
            type="color"
            value={value.color}
            onChange={(e) => onChange({ ...value, color: e.target.value })}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  )
}

type ShareState =
  | { step: 'idle' }
  | { step: 'verify' }
  | { step: 'creating' }
  | { step: 'done'; url: string }
  | { step: 'error'; message: string }

export default function PaperDesk() {
  const holderRef = useRef<HTMLDivElement>(null)
  const [cfg, setCfg] = useState<PaperConfig>(DEFAULT_CONFIG)
  const [hydrated, setHydrated] = useState(false)
  const [share, setShare] = useState<ShareState>({ step: 'idle' })
  const [copied, setCopied] = useState(false)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

  // restore the draft
  useEffect(() => {
    const fresh = { ...DEFAULT_CONFIG, date: formatDate(new Date()) }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      setCfg(raw ? sanitizeConfig(JSON.parse(raw)) : fresh)
    } catch {
      setCfg(fresh)
    }
    setHydrated(true)
  }, [])

  const { sceneRef, sfxRef, ready, error } = usePaperScene(holderRef, cfg, hydrated)

  // push edits to the scene (debounced), then redraw again once new glyphs arrive
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      sceneRef.current?.setConfig(cfg)
      loadGlyphs(cfg).then(() => sceneRef.current?.redrawPaper())
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
      } catch {}
    }, 120)
    return () => clearTimeout(t)
  }, [cfg, ready, sceneRef])

  const set = <K extends keyof PaperConfig>(k: K, v: PaperConfig[K]) => {
    setCfg((c) => ({ ...c, [k]: v }))
    // an edit makes the previous link stale
    setShare((s) => (s.step === 'done' || s.step === 'error' ? { step: 'idle' } : s))
  }

  const resetDraft = () => {
    setCfg({ ...DEFAULT_CONFIG, date: formatDate(new Date()) })
    setShare({ step: 'idle' })
  }

  const createShare = async (token: string) => {
    if (!token) return
    setShare({ step: 'creating' })
    try {
      const res = await fetch('/api/paper-desk/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cfg, turnstileToken: token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.code) throw new Error(data.error || `http_${res.status}`)
      // NEXT_PUBLIC_SHARE_ORIGIN lets dev links point at an address other devices can reach (e.g. a Tailscale host)
      const origin = (process.env.NEXT_PUBLIC_SHARE_ORIGIN || window.location.origin).replace(/\/$/, '')
      setShare({ step: 'done', url: `${origin}/z/${data.code}` })
      gaEvent('paper_desk_create', { status: 'success' })
    } catch (e) {
      const code = e instanceof Error ? e.message : 'unknown'
      setShare({ step: 'error', message: code === 'turnstile_failed' ? '人机验证失败，请重试' : '生成失败，请稍后再试' })
      gaEvent('paper_desk_create', { status: 'fail', error: code })
    }
  }

  const startShare = () => {
    if (isBlank(cfg)) {
      setShare({ step: 'error', message: '纸上还什么都没写' })
      return
    }
    setShare({ step: 'verify' })
  }

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      gaEvent('paper_desk_share', { status: 'copy_link' })
    } catch {}
  }

  const downloadImage = async () => {
    const blob = await sceneRef.current?.snapshot()
    if (!blob) return
    downloadBlob(blob, `${cfg.title.trim() || 'paper'}.png`)
    gaEvent('paper_desk_share', { status: 'download_image' })
  }

  const inputCls =
    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400'

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-4rem)]">
      <div className="relative flex-1 min-h-[62vh] lg:min-h-0 rounded-2xl overflow-hidden bg-[#1a1410] shadow-inner">
        <div ref={holderRef} className="absolute inset-0" />
        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center text-amber-100/80 text-sm tracking-widest">铺纸中…</div>
        )}
        {error && <div className="absolute inset-0 grid place-items-center text-red-200 text-sm px-6 text-center">{error}</div>}
        {ready && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/35 px-3 py-1 text-[11px] text-amber-50/90 backdrop-blur">
            预览即分享效果 · 拖纸角掀起 · 双击 / 滚轮放大
          </div>
        )}
        {ready && <SoundToggle sfx={sfxRef.current} className="absolute right-3 top-3" />}
        {ready && <ZoomControls scene={sceneRef.current} className="absolute right-3 bottom-3" />}
      </div>

      <aside className="w-full lg:w-[360px] shrink-0 lg:overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-gray-900">桌上的纸</h1>
            <p className="text-xs text-gray-500 mt-0.5">写一张 A4 纸放在桌上，生成链接发给 TA。</p>
          </div>
          <button
            type="button"
            onClick={resetDraft}
            title="恢复默认内容"
            className="shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100"
          >
            <RotateCcw size={12} /> 默认
          </button>
        </div>

        <Field label="标题" hint={`${cfg.title.length}/${LIMITS.title}`}>
          <input className={inputCls} value={cfg.title} maxLength={LIMITS.title} onChange={(e) => set('title', e.target.value)} />
          <div className="flex items-center gap-2">
            <StyleRow value={cfg.titleStyle} onChange={(v) => set('titleStyle', v)} />
            <Chips value={cfg.titleAlign} options={{ center: { label: '居中' }, left: { label: '居左' } }} onChange={(v) => set('titleAlign', v)} />
          </div>
        </Field>

        <Field label="正文" hint={`${cfg.body.length}/${LIMITS.body}`}>
          <textarea
            className={`${inputCls} min-h-[180px] resize-y leading-relaxed`}
            value={cfg.body}
            maxLength={LIMITS.body}
            onChange={(e) => set('body', e.target.value)}
          />
          <StyleRow value={cfg.bodyStyle} onChange={(v) => set('bodyStyle', v)} />
        </Field>

        <Field label="落款">
          <div className="grid grid-cols-2 gap-2">
            <input
              className={inputCls}
              value={cfg.signature}
              maxLength={LIMITS.signature}
              placeholder="申请人：老公"
              onChange={(e) => set('signature', e.target.value)}
            />
            <div className="flex gap-1">
              <input
                className={inputCls}
                value={cfg.date}
                maxLength={LIMITS.date}
                placeholder="日期"
                onChange={(e) => set('date', e.target.value)}
              />
              <button
                type="button"
                title="填今天"
                onClick={() => set('date', formatDate(new Date()))}
                className="shrink-0 rounded-lg border border-gray-200 px-2 text-gray-500 hover:text-gray-900"
              >
                <CalendarDays size={16} />
              </button>
            </div>
          </div>
          <StyleRow value={cfg.signStyle} onChange={(v) => set('signStyle', v)} />
        </Field>

        <Field label="字号" hint={`${Math.round(cfg.fontScale * 100)}%`}>
          <input
            type="range"
            min={0.7}
            max={1.4}
            step={0.05}
            value={cfg.fontScale}
            onChange={(e) => set('fontScale', Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </Field>
        <Field label="纸张">
          <Chips value={cfg.style} options={PAPER_STYLES} onChange={(v) => set('style', v)} />
        </Field>
        <Field label="桌面">
          <Chips value={cfg.desk} options={DESKS} onChange={(v) => set('desk', v)} />
        </Field>

        <Field label="盖章批准">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={cfg.stamp}
              onChange={(e) => set('stamp', e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            对方可以批复：批准盖章 / 拒绝进碎纸机
          </label>
          {cfg.stamp && (
            <input
              className={inputCls}
              value={cfg.stampText}
              maxLength={LIMITS.stampText}
              placeholder="印章文字"
              onChange={(e) => set('stampText', e.target.value)}
            />
          )}
        </Field>

        <div className="space-y-2 border-t border-gray-100 pt-4">
          {share.step === 'idle' || share.step === 'error' ? (
            <button
              type="button"
              onClick={startShare}
              disabled={!ready}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              <Share2 size={16} /> 生成分享链接
            </button>
          ) : null}
          {share.step === 'error' && <p className="text-xs text-red-600">{share.message}</p>}
          {share.step === 'verify' &&
            (siteKey ? (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">完成人机验证后自动生成链接</p>
                <TurnstileWidget siteKey={siteKey} onToken={createShare} />
              </div>
            ) : (
              <p className="text-xs text-red-600">未配置 NEXT_PUBLIC_TURNSTILE_SITE_KEY</p>
            ))}
          {share.step === 'creating' && (
            <div className="flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" /> 正在生成…
            </div>
          )}
          {share.step === 'done' && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-900">链接已生成，发给 TA 吧</p>
              <div className="flex gap-1.5">
                <input readOnly value={share.url} className="min-w-0 flex-1 rounded-md border border-amber-200 bg-white px-2 py-1.5 text-xs" />
                <button
                  type="button"
                  onClick={() => copyLink(share.url)}
                  className="shrink-0 flex items-center gap-1 rounded-md bg-amber-500 px-2.5 text-xs font-medium text-white hover:bg-amber-600"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? '已复制' : '复制'}
                </button>
                <a
                  href={share.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => gaEvent('paper_desk_share', { status: 'open_link' })}
                  className="shrink-0 grid place-items-center rounded-md border border-amber-200 bg-white px-2 text-amber-800 hover:bg-amber-100"
                  title="打开看看"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={downloadImage}
            disabled={!ready}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:border-gray-400 disabled:opacity-50"
          >
            <Download size={16} /> 下载图片
          </button>
        </div>
      </aside>
    </div>
  )
}
