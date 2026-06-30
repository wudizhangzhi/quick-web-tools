'use client'

import { Star, Plus, Minus } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import type { CartItem } from '@/lib/fake-takeout/cart'
import { qtyOf } from '@/lib/fake-takeout/cart'
import DishThumb from './DishThumb'

export default function ShopDetail({
  shop,
  items,
  onAdd,
  onRemove,
}: {
  shop: Shop
  items: CartItem[]
  onAdd: (dishId: string) => void
  onRemove: (dishId: string) => void
}) {
  return (
    <div className="pb-4">
      {/* 店招 */}
      <div className="bg-gradient-to-br from-orange-400 to-rose-400 px-4 pb-5 pt-3 text-white">
        <p className="text-xl font-bold">{shop.name}</p>
        <div className="mt-2 flex items-center gap-3 text-sm text-white/90">
          <span className="flex items-center gap-0.5">
            <Star size={14} className="fill-white" />
            {shop.rating.toFixed(1)}
          </span>
          <span>月售 {shop.monthlySales}</span>
          <span>约 {shop.deliveryMinutes} 分钟</span>
        </div>
        <p className="mt-2 rounded-lg bg-white/15 px-2 py-1 text-xs">
          公告：{shop.notice}
        </p>
      </div>

      {/* 菜单 */}
      <div className="space-y-3 p-3">
        <h2 className="px-1 text-sm font-bold text-gray-700">招牌菜单</h2>
        {shop.dishes.map((dish) => {
          const qty = qtyOf(items, dish.id)
          return (
            <div key={dish.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <DishThumb
                image={dish.image}
                emoji={dish.emoji}
                alt={dish.name}
                className="h-20 w-20 flex-shrink-0 rounded-xl"
                emojiClassName="text-4xl"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="font-medium text-gray-900">{dish.name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{dish.desc}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  <span>月售 {dish.monthlySales}</span>
                  {dish.tags?.map((t) => (
                    <span key={t} className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-500">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-bold text-rose-500">
                    <span className="text-xs">¥</span>
                    {dish.price}
                  </span>
                  <div className="flex items-center gap-2">
                    {qty > 0 && (
                      <>
                        <button
                          onClick={() => onRemove(dish.id)}
                          aria-label="减少"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-400 text-orange-500 active:scale-90"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{qty}</span>
                      </>
                    )}
                    <button
                      onClick={() => onAdd(dish.id)}
                      aria-label="增加"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white active:scale-90"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* 买家秀 */}
        <h2 className="px-1 pt-2 text-sm font-bold text-gray-700">
          买家秀 ({shop.reviews.length})
        </h2>
        {shop.reviews.map((r, i) => (
          <div key={i} className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-lg">
                {r.avatar}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-800">{r.user}</p>
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      size={11}
                      className={s < r.stars ? 'fill-amber-400' : 'fill-gray-200 text-gray-200'}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
            {r.dishName && (
              <p className="mt-1 text-xs text-gray-400">— {r.dishName}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
