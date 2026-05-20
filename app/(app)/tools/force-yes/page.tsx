'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TurnstileWidget from '@/components/TurnstileWidget'
import { HAPPY_MEMES, SAD_MEMES, type MemeDef } from '@/lib/force-yes/memes'
import {
  YES_TEXT_MAX,
  NO_TEXT_MAX,
  YES_EFFECT_TEXT_MAX,
} from '@/lib/force-yes/constants'
import { event as gaEvent } from '@/lib/gtag'

type SlotIndex = 0 | 1 | 2

function MemeGrid({ memes, selected, disabled = [], onPick }: {
  memes: MemeDef[]
  selected: string | null
  disabled?: string[]
  onPick: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
      {memes.map((m) => {
        const isSel = selected === m.id
        const isDis = !isSel && disabled.includes(m.id)
        return (
          <button
            key={m.id}
            type="button"
            disabled={isDis}
            onClick={() => onPick(m.id)}
            className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition ${
              isSel ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-400'
            } ${isDis ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="text-3xl">{m.emoji}</span>
            <span className="text-xs text-gray-600">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function ForceYesCreatePage() {
  const router = useRouter()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

  const [yesText, setYesText] = useState('我愿意')
  const [noText, setNoText] = useState('再想想')
  const [yesEffectText, setYesEffectText] = useState('谢谢你，从今天起我们就是好朋友啦 ✨')
  const [yesMeme, setYesMeme] = useState<string | null>(null)
  const [noMemes, setNoMemes] = useState<(string | null)[]>([null, null, null])
  const [token, setToken] = useState<string>('')
  const [existingCode, setExistingCode] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/force-yes/me')
      .then((r) => r.json())
      .then((d: { code?: string }) => {
        if (d.code) setExistingCode(d.code)
      })
      .catch(() => {})
  }, [])

  const pickNo = (slot: SlotIndex, id: string) => {
    setNoMemes((prev) => {
      const next = [...prev]
      next[slot] = id
      return next
    })
  }

  const noMemesDisabled = useMemo(() => noMemes.filter(Boolean) as string[], [noMemes])

  const ready =
    yesText.trim().length > 0 &&
    yesText.length <= YES_TEXT_MAX &&
    noText.trim().length > 0 &&
    noText.length <= NO_TEXT_MAX &&
    yesEffectText.trim().length > 0 &&
    yesEffectText.length <= YES_EFFECT_TEXT_MAX &&
    !!yesMeme &&
    noMemes.every(Boolean) &&
    !!token &&
    !submitting

  const onSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/force-yes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yesText: yesText.trim(),
          noText: noText.trim(),
          yesEffectText: yesEffectText.trim(),
          yesMeme,
          noMemes,
          turnstileToken: token,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        gaEvent('force_yes_create', { status: data.error ?? 'unknown_error' })
        setError(data.error ?? '提交失败')
        setSubmitting(false)
        return
      }
      gaEvent('force_yes_create', { status: data.mode === 'overwrite' ? 'overwrite_success' : 'success' })
      router.push(`/y/${data.code}?owner=1`)
    } catch (e) {
      gaEvent('force_yes_create', { status: 'network_error' })
      setError('网络错误')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">钦定 yes · 强制选中</h1>
        <p className="mt-1 text-sm text-gray-600">配置文案与表情，生成你的专属链接 —— 对方只能选 yes。</p>
      </header>

      {existingCode && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          你已有链接 <code className="font-mono">/y/{existingCode}</code>。再次提交将<strong>覆盖</strong>它的配置（短码不变）。
        </div>
      )}

      <section className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Yes 按钮文字</span>
          <input
            type="text"
            value={yesText}
            onChange={(e) => setYesText(e.target.value)}
            maxLength={YES_TEXT_MAX}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <span className="mt-1 text-xs text-gray-500">{yesText.length}/{YES_TEXT_MAX}</span>
        </label>

        <label className="block">
          <span className="text-sm font-medium">No 按钮文字</span>
          <input
            type="text"
            value={noText}
            onChange={(e) => setNoText(e.target.value)}
            maxLength={NO_TEXT_MAX}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <span className="mt-1 text-xs text-gray-500">{noText.length}/{NO_TEXT_MAX}</span>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Yes 成功文案</span>
          <textarea
            value={yesEffectText}
            onChange={(e) => setYesEffectText(e.target.value)}
            maxLength={YES_EFFECT_TEXT_MAX}
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <span className="mt-1 text-xs text-gray-500">{yesEffectText.length}/{YES_EFFECT_TEXT_MAX}</span>
        </label>
      </section>

      <section>
        <h2 className="text-sm font-medium">挑 1 张 Yes 表情包</h2>
        <div className="mt-2">
          <MemeGrid memes={HAPPY_MEMES} selected={yesMeme} onPick={setYesMeme} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">挑 3 张 No 表情包（顺序 = 升级强度）</h2>
        {([0, 1, 2] as SlotIndex[]).map((slot) => (
          <div key={slot} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 text-xs text-gray-500">
              ① ② ③ 第 {slot + 1} 张 — {slot === 0 ? '初次劝阻' : slot === 1 ? '加大力度' : '最终绝杀'}
            </div>
            <MemeGrid
              memes={SAD_MEMES}
              selected={noMemes[slot]}
              disabled={noMemesDisabled.filter((id) => id !== noMemes[slot])}
              onPick={(id) => pickNo(slot, id)}
            />
          </div>
        ))}
      </section>

      <section>
        {siteKey ? (
          <TurnstileWidget siteKey={siteKey} onToken={setToken} />
        ) : (
          <div className="text-xs text-red-600">未配置 NEXT_PUBLIC_TURNSTILE_SITE_KEY</div>
        )}
      </section>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        type="button"
        disabled={!ready}
        onClick={onSubmit}
        className="w-full rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-50 hover:bg-yellow-600"
      >
        {submitting ? '生成中…' : existingCode ? '覆盖并生成链接' : '生成专属链接'}
      </button>
    </div>
  )
}
