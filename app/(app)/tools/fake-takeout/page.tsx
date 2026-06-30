'use client'

import Link from 'next/link'
import { UtensilsCrossed, ArrowRight, ShoppingCart, MapPin, Bike, type LucideIcon } from 'lucide-react'
import { event as gaEvent } from '@/lib/gtag'

export default function FakeTakeoutToolPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <UtensilsCrossed className="text-orange-500" /> 画饼外卖
        </h1>
        <p className="mt-2 text-gray-500">
          一个「假装点外卖」的多巴胺网站。逛虚构店铺、看买家秀、加购物车、填收货地址、下单，
          然后看骑手在地图上往你家送——
          <span className="font-medium text-orange-500">核心玄机：你永远收不到货，骑手永远在路上。</span>
          纯前端模拟，不花一分钱，专治嘴馋。
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Feature icon={ShoppingCart} title="逛店下单" desc="麻辣烫、炸鸡、螺蛳粉、奶茶，加购结算一条龙" />
        <Feature icon={MapPin} title="填地址" desc="认真填个收货地址，假装它真的有用" />
        <Feature icon={Bike} title="看骑手送" desc="地图上骑手卡在 99%，配荒诞实时动态" />
      </div>

      <Link
        href="/wm"
        onClick={() => gaEvent('fake_takeout_open')}
        className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-4 text-lg font-bold text-white shadow-md transition hover:shadow-lg"
      >
        进入画饼外卖
        <ArrowRight size={20} className="transition group-hover:translate-x-1" />
      </Link>

      <p className="mt-3 text-center text-xs text-gray-400">
        独立全屏页面，建议在手机上体验更带感
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
      <Icon size={22} className="mb-2 text-orange-500" />
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{desc}</p>
    </div>
  )
}
