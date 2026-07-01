'use client'

import Link from 'next/link'
import { Gem, ArrowRight, ShoppingBag, Sparkles, Ban, type LucideIcon } from 'lucide-react'
import { event as gaEvent } from '@/lib/gtag'
import { BRAND_NAME } from '@/lib/virtual-hermes/data'

export default function VirtualHermesToolPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Gem className="text-amber-700" /> {BRAND_NAME}
        </h1>
        <p className="mt-2 text-gray-500">
          官网级奢侈品购物体验。逛店、加购、看价格，
          <span className="font-medium text-amber-800">但永远买不到——配货员永远在路上。</span>
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Feature icon={Sparkles} title="官网级 UI" desc="奶油色背景、双行导航、编辑区块与产品网格" />
        <Feature icon={ShoppingBag} title="购物袋" desc="选尺码加入购物袋，完整结算与配货追踪" />
        <Feature icon={Ban} title="永远缺货" desc="配货进度最高 98%，骑手……不，工匠永远在路上" />
      </div>

      <Link
        href="/hm"
        onClick={() => gaEvent('virtual_hermes_open')}
        className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-800 to-orange-900 px-6 py-4 text-lg font-bold text-white shadow-md transition hover:shadow-lg"
      >
        进入{BRAND_NAME}
        <ArrowRight size={20} className="transition group-hover:translate-x-1" />
      </Link>

      <p className="mt-3 text-center text-xs text-gray-400">
        独立全屏页面，建议在桌面端宽屏浏览
      </p>
    </div>
  )
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon
  title: string
  desc: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <Icon size={22} className="mb-2 text-amber-700" />
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{desc}</p>
    </div>
  )
}