'use client'

import Link from 'next/link'
import { event as gaEvent } from '@/lib/gtag'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">这张纸找不到了</h1>
      <p className="mt-2 text-sm text-gray-600">链接不存在或已过期（保存 90 天），让对方重新写一张吧。</p>
      <Link
        href="/tools/paper-desk"
        onClick={() => gaEvent('paper_desk_cta', { status: 'not_found' })}
        className="mt-6 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm text-white"
      >
        我也写一张
      </Link>
    </div>
  )
}
