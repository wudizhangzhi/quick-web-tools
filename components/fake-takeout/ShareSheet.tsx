'use client'

import { useState } from 'react'
import { X, Link2, Share2 } from 'lucide-react'
import { event as gaEvent } from '@/lib/gtag'
import { shopShareText, shopShareUrl } from '@/lib/fake-takeout/share'
import type { Shop } from '@/lib/fake-takeout/types'

export default function ShareSheet({ shop, open, onClose }: { shop: Shop; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const url = shopShareUrl(shop.id)
  const text = shopShareText(shop.name)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      gaEvent('fake_takeout_share', { status: 'copy_link' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    if (!navigator.share) return
    try {
      await navigator.share({ title: shop.name, text, url })
      gaEvent('fake_takeout_share', { status: 'native_share' })
      onClose()
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-t-2xl bg-white px-4 pb-8 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">分享店铺</h3>
          <button onClick={onClose} aria-label="关闭" className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">{text}</p>

        <div className="space-y-2">
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-xl bg-[#FFF9E0] px-4 py-3 text-left active:bg-[#FFF3B0]"
          >
            <Link2 size={20} className="text-[#FF8A00]" />
            <span className="text-sm font-medium text-gray-800">{copied ? '已复制链接 ✓' : '复制链接'}</span>
          </button>

          {typeof navigator !== 'undefined' && !!navigator.share && (
            <button
              onClick={nativeShare}
              className="flex w-full items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-left active:bg-gray-100"
            >
              <Share2 size={20} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-800">系统分享</span>
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-gray-300">分享出去也送不到，放心画饼</p>
      </div>
    </div>
  )
}