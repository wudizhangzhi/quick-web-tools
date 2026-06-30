'use client'

import { useState } from 'react'
import { ChevronRight, Bike } from 'lucide-react'
import type { Order } from '@/lib/fake-takeout/order'
import { deliverySnapshot } from '@/lib/fake-takeout/delivery'
import { cartCount } from '@/lib/fake-takeout/cart'
import StatusBar from './StatusBar'

const TABS = ['全部', '待收货', '已完成']

function agoText(startMs: number): string {
  const min = Math.floor((Date.now() - startMs) / 60000)
  if (min < 1) return '刚刚下单'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

export default function OrdersView({
  orders,
  onOpenOrder,
  onGoHome,
}: {
  orders: Order[]
  onOpenOrder: (no: string) => void
  onGoHome: () => void
}) {
  const [tab, setTab] = useState(0)
  // 已完成永远为空（永远收不到货）
  const list = tab === 2 ? [] : orders

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]">
      <div className="bg-[#FFD100] px-4 pb-1">
        <StatusBar dark />
        <h1 className="px-1 py-1 text-lg font-bold text-gray-900">我的订单</h1>
        <div className="flex gap-6 pt-1">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className="relative pb-2 text-sm">
              <span className={tab === i ? 'font-bold text-gray-900' : 'text-gray-700'}>{t}</span>
              {tab === i && <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded bg-gray-900" />}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {list.length === 0 ? (
          <div className="flex flex-col items-center pt-24 text-center">
            <span className="text-6xl">🍽️</span>
            <p className="mt-4 text-sm text-gray-400">
              {tab === 2 ? '一单都没送到，何来「已完成」' : '还没下过单，快去画个饼'}
            </p>
            <button
              onClick={onGoHome}
              className="mt-4 rounded-full bg-[#FFD100] px-6 py-2 text-sm font-bold text-gray-900"
            >
              去逛逛
            </button>
          </div>
        ) : (
          list.map((o) => {
            const snap = deliverySnapshot((Date.now() - o.startMs) / 1000)
            return (
              <button
                key={o.no}
                onClick={() => onOpenOrder(o.no)}
                className="mb-2.5 w-full rounded-xl bg-white p-3.5 text-left"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <span className="flex items-center gap-1.5 font-medium text-gray-900">
                    <span className="text-lg">{o.shopLogo}</span>
                    {o.shopName}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-[#FF6000]">
                    <Bike size={13} /> 配送中
                  </span>
                </div>
                <p className="mt-2 line-clamp-1 text-xs text-gray-500">🛵 {snap.status}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {agoText(o.startMs)} · 共 {cartCount(o.items)} 件 · 实付 ¥{o.payable}
                  </span>
                  <span className="flex items-center text-xs text-gray-400">
                    查看配送 <ChevronRight size={13} />
                  </span>
                </div>
              </button>
            )
          })
        )}
        {list.length > 0 && <p className="py-3 text-center text-xs text-gray-300">—— 它们都还在路上 ——</p>}
      </div>
    </div>
  )
}
