'use client'

import { Trash2 } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import type { CartItem } from '@/lib/fake-takeout/cart'
import { cartLines } from '@/lib/fake-takeout/cart'
import DishThumb from './DishThumb'
import Stepper from './Stepper'

/** 从购物车条上滑出的购物车明细面板。 */
export default function CartSheet({
  shop,
  items,
  open,
  onClose,
  onAdd,
  onRemove,
  onClear,
}: {
  shop: Shop
  items: CartItem[]
  open: boolean
  onClose: () => void
  onAdd: (dishId: string) => void
  onRemove: (dishId: string) => void
  onClear: () => void
}) {
  if (!open) return null
  const lines = cartLines(shop, items)

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[60%] overflow-y-auto rounded-t-2xl bg-white pb-20">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-[#F7F7F7] px-4 py-2.5">
          <span className="text-sm font-medium text-gray-700">购物车</span>
          <button onClick={onClear} className="flex items-center gap-1 text-xs text-gray-400">
            <Trash2 size={13} /> 清空
          </button>
        </div>
        {lines.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">购物车空空，连饼都还没画</p>
        ) : (
          lines.map((line) => (
            <div key={line.dish.id} className="flex items-center gap-2.5 px-4 py-3">
              <DishThumb
                image={line.dish.image}
                emoji={line.dish.emoji}
                alt={line.dish.name}
                className="h-11 w-11 flex-shrink-0 rounded-md"
                emojiClassName="text-xl"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{line.dish.name}</span>
              <span className="text-sm font-bold text-[#FF4E12]">¥{line.subtotal}</span>
              <Stepper
                qty={line.qty}
                onAdd={() => onAdd(line.dish.id)}
                onRemove={() => onRemove(line.dish.id)}
                size={24}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
