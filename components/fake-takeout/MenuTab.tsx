'use client'

import { useState } from 'react'
import type { Shop } from '@/lib/fake-takeout/types'
import type { CartItem } from '@/lib/fake-takeout/cart'
import { qtyOf } from '@/lib/fake-takeout/cart'
import { dishesByCategory } from '@/lib/fake-takeout/data'
import DishRow from './DishRow'

export default function MenuTab({
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
  const groups = dishesByCategory(shop)
  const [activeCat, setActiveCat] = useState(groups[0]?.category.id ?? '')
  const active = groups.find((g) => g.category.id === activeCat) ?? groups[0]

  /** 某分类购物车内份数（用于左栏红点）。 */
  function catQty(catId: string): number {
    return shop.dishes
      .filter((d) => d.categoryId === catId)
      .reduce((sum, d) => sum + qtyOf(items, d.id), 0)
  }

  return (
    <div className="flex">
      {/* 左侧分类栏 */}
      <div className="w-[88px] flex-shrink-0 bg-[#F5F5F5]">
        {groups.map((g) => {
          const isActive = g.category.id === active?.category.id
          const q = catQty(g.category.id)
          return (
            <button
              key={g.category.id}
              onClick={() => setActiveCat(g.category.id)}
              className={`relative flex w-full items-center px-2 py-3.5 text-[13px] leading-tight ${
                isActive ? 'bg-white font-bold text-gray-900' : 'text-gray-600'
              }`}
            >
              {isActive && <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r bg-[#FFD100]" />}
              <span className="text-left">{g.category.name}</span>
              {q > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4E12] px-1 text-[10px] font-bold text-white">
                  {q}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 右侧菜品 */}
      <div className="min-w-0 flex-1 bg-white">
        <p className="px-3 pt-3 text-xs font-bold text-gray-400">{active?.category.name}</p>
        {active?.dishes.map((dish) => (
          <DishRow
            key={dish.id}
            dish={dish}
            qty={qtyOf(items, dish.id)}
            onAdd={() => onAdd(dish.id)}
            onRemove={() => onRemove(dish.id)}
          />
        ))}
      </div>
    </div>
  )
}
