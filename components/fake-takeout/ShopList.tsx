'use client'

import { Star } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import { SHOPS } from '@/lib/fake-takeout/menu'
import DishThumb from './DishThumb'

export default function ShopList({
  onSelect,
}: {
  onSelect: (shop: Shop) => void
}) {
  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 p-4 text-white shadow-sm">
        <p className="text-lg font-bold">附近的店，闻着香 🍱</p>
        <p className="mt-1 text-sm text-white/90">
          下单一时爽，等餐火葬场。本平台只画饼，不送达。
        </p>
      </div>

      {SHOPS.map((shop) => (
        <button
          key={shop.id}
          onClick={() => onSelect(shop)}
          className="flex w-full gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition active:scale-[0.99]"
        >
          <DishThumb
            image={shop.dishes.find((d) => d.image)?.image}
            emoji={shop.emoji}
            alt={shop.name}
            className="h-20 w-20 flex-shrink-0 rounded-xl"
            emojiClassName="text-4xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{shop.name}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-0.5 text-amber-500">
                <Star size={12} className="fill-amber-400" />
                {shop.rating.toFixed(1)}
              </span>
              <span>月售 {shop.monthlySales}</span>
            </div>
            <p className="mt-1 truncate text-xs text-gray-400">{shop.notice}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span className="rounded bg-orange-50 px-1.5 py-0.5 text-orange-500">
                约 {shop.deliveryMinutes} 分钟
              </span>
              <span>{shop.distanceKm} km</span>
              <span>起送 ¥{shop.minOrder}</span>
            </div>
          </div>
        </button>
      ))}

      <p className="py-4 text-center text-xs text-gray-300">
        —— 没有更多了，反正也送不到 ——
      </p>
    </div>
  )
}
