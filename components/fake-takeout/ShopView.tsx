'use client'

import { useState } from 'react'
import { ChevronLeft, Search, Share2 } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import type { CartItem } from '@/lib/fake-takeout/cart'
import Stars from './Stars'
import MenuTab from './MenuTab'
import ReviewsTab from './ReviewsTab'
import MerchantTab from './MerchantTab'
import CartBar from './CartBar'
import CartSheet from './CartSheet'

type Tab = 'menu' | 'reviews' | 'merchant'

export default function ShopView({
  shop,
  items,
  onAdd,
  onRemove,
  onBack,
  onCheckout,
  onClear,
}: {
  shop: Shop
  items: CartItem[]
  onAdd: (dishId: string) => void
  onRemove: (dishId: string) => void
  onBack: () => void
  onCheckout: () => void
  onClear: () => void
}) {
  const [tab, setTab] = useState<Tab>('menu')
  const [sheetOpen, setSheetOpen] = useState(false)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'menu', label: '点菜' },
    { key: 'reviews', label: `评价 ${shop.reviews.length}` },
    { key: 'merchant', label: '商家' },
  ]

  return (
    <div className="relative flex h-full flex-col bg-[#F5F5F5]">
      {/* 店招 */}
      <div className="relative bg-gradient-to-br from-[#FF8A00] to-[#FF4E12] px-3 pb-3 pt-2">
        <div className="flex items-center justify-between text-white">
          <button onClick={onBack} aria-label="返回" className="-ml-1 p-1">
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-3">
            <Search size={20} />
            <Share2 size={20} />
          </div>
        </div>
        <div className="mt-1 flex items-center gap-3 pb-1">
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/95 text-4xl shadow">
            {shop.logo}
          </span>
          <div className="min-w-0 flex-1 text-white">
            <h1 className="truncate text-lg font-bold">{shop.name}</h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs">
              <Stars value={shop.rating} size={11} />
              <span className="font-medium">{shop.rating.toFixed(1)}</span>
              <span className="text-white/85">月售{shop.monthlySales > 9999 ? '9999+' : shop.monthlySales}</span>
              <span className="text-white/85">人均¥{shop.perCapita}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 信息卡：公告 + 促销 */}
      <div className="-mt-1 rounded-t-2xl bg-white px-4 pb-2.5 pt-3">
        <p className="line-clamp-1 text-xs text-gray-500">📢 {shop.notice}</p>
        {shop.promotions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shop.promotions.map((p, i) => (
              <span
                key={i}
                className="rounded-[3px] border border-[#FFD0C4] px-1 py-px text-[10px] leading-tight text-[#FF4E12]"
              >
                {p.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative flex-1 py-2.5 text-sm"
          >
            <span className={tab === t.key ? 'font-bold text-gray-900' : 'text-gray-500'}>{t.label}</span>
            {tab === t.key && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded bg-[#FFD100]" />
            )}
          </button>
        ))}
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto pb-20">
        {tab === 'menu' && <MenuTab shop={shop} items={items} onAdd={onAdd} onRemove={onRemove} />}
        {tab === 'reviews' && <ReviewsTab shop={shop} />}
        {tab === 'merchant' && <MerchantTab shop={shop} />}
      </div>

      {/* 购物车面板 */}
      <CartSheet
        shop={shop}
        items={items}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={onAdd}
        onRemove={onRemove}
        onClear={() => {
          onClear()
          setSheetOpen(false)
        }}
      />

      {/* 底部购物车条 */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3">
        <CartBar shop={shop} items={items} onOpenCart={() => setSheetOpen((v) => !v)} onCheckout={onCheckout} />
      </div>
    </div>
  )
}
