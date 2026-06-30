'use client'

import { Plus, Minus, Trash2 } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import type { CartItem } from '@/lib/fake-takeout/cart'
import { cartLines, subtotal } from '@/lib/fake-takeout/cart'
import DishThumb from './DishThumb'

export default function CartView({
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
  const lines = cartLines(shop, items)

  return (
    <div className="p-3">
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="font-bold text-gray-800">{shop.name}</span>
          <span className="text-xs text-gray-400">配送费 ¥{shop.deliveryFee}</span>
        </div>

        {lines.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">
            购物车空空，连饼都还没画
          </p>
        ) : (
          lines.map((line) => (
            <div key={line.dish.id} className="flex items-center gap-3 px-4 py-3">
              <DishThumb
                image={line.dish.image}
                emoji={line.dish.emoji}
                alt={line.dish.name}
                className="h-14 w-14 flex-shrink-0 rounded-lg"
                emojiClassName="text-2xl"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{line.dish.name}</p>
                <p className="text-sm font-bold text-rose-500">¥{line.subtotal}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRemove(line.dish.id)}
                  aria-label="减少"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-400 text-orange-500 active:scale-90"
                >
                  {line.qty === 1 ? <Trash2 size={14} /> : <Minus size={16} />}
                </button>
                <span className="w-5 text-center text-sm font-medium">{line.qty}</span>
                <button
                  onClick={() => onAdd(line.dish.id)}
                  aria-label="增加"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white active:scale-90"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {lines.length > 0 && (
        <div className="mt-3 rounded-2xl bg-white p-4 text-sm shadow-sm">
          <div className="flex justify-between text-gray-500">
            <span>菜品小计</span>
            <span>¥{subtotal(shop, items)}</span>
          </div>
          <div className="mt-2 flex justify-between text-gray-500">
            <span>配送费</span>
            <span>¥{shop.deliveryFee}</span>
          </div>
        </div>
      )}
    </div>
  )
}
