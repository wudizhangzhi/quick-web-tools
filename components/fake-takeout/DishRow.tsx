'use client'

import type { Dish } from '@/lib/fake-takeout/types'
import DishThumb from './DishThumb'
import Stepper from './Stepper'

export default function DishRow({
  dish,
  qty,
  onAdd,
  onRemove,
}: {
  dish: Dish
  qty: number
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex gap-2.5 border-b border-gray-50 px-3 py-3 last:border-0">
      <DishThumb
        image={dish.image}
        emoji={dish.emoji}
        alt={dish.name}
        className="h-[76px] w-[76px] flex-shrink-0 rounded-lg"
        emojiClassName="text-4xl"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[15px] font-medium leading-tight text-gray-900">{dish.name}</p>
        {dish.tags && dish.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {dish.tags.map((t) => (
              <span key={t} className="rounded-[3px] bg-[#FFF1E8] px-1 text-[10px] text-[#FF6000]">
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="mt-1 line-clamp-1 text-xs text-gray-400">{dish.desc}</p>
        <p className="mt-1 text-[11px] text-gray-400">
          月售{dish.monthlySales} · 好评{dish.goodRate}%
        </p>
        <div className="mt-auto flex items-end justify-between pt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[#FF4E12]">
              <span className="text-xs">¥</span>
              <span className="text-lg font-bold">{dish.price}</span>
            </span>
            {dish.originalPrice && dish.originalPrice > dish.price && (
              <span className="text-xs text-gray-400 line-through">¥{dish.originalPrice}</span>
            )}
          </div>
          <Stepper qty={qty} onAdd={onAdd} onRemove={onRemove} />
        </div>
      </div>
    </div>
  )
}
