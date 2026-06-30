'use client'

import { ShoppingCart } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import type { CartItem } from '@/lib/fake-takeout/cart'
import { cartCount, subtotal, total, meetsMinOrder, amountToMinOrder, packagingFee } from '@/lib/fake-takeout/cart'

/** 店铺页底部购物车结算条（美团黄色样式）。 */
export default function CartBar({
  shop,
  items,
  onOpenCart,
  onCheckout,
}: {
  shop: Shop
  items: CartItem[]
  onOpenCart: () => void
  onCheckout: () => void
}) {
  const count = cartCount(items)
  const canCheckout = meetsMinOrder(shop, items)
  const empty = count === 0

  return (
    <div className="mx-auto flex h-14 max-w-[440px] items-center justify-between rounded-full bg-[#2D2D2D] pl-4 pr-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-3">
        <button onClick={onOpenCart} className="relative" aria-label="购物车">
          <span
            className={`flex h-12 w-12 -translate-y-2 items-center justify-center rounded-full ${
              empty ? 'bg-[#5A5A5A]' : 'bg-[#FFD100]'
            }`}
          >
            <ShoppingCart size={24} className={empty ? 'text-gray-300' : 'text-gray-900'} />
          </span>
          {count > 0 && (
            <span className="absolute -right-1 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#2D2D2D] bg-[#FF4E12] px-1 text-xs font-bold text-white">
              {count}
            </span>
          )}
        </button>
        <div className="-ml-1">
          {empty ? (
            <p className="text-sm text-gray-400">未选购商品</p>
          ) : (
            <>
              <p className="text-lg font-bold leading-tight text-white">
                ¥{total(shop, items)}
                <span className="ml-1 text-[11px] font-normal text-gray-400 line-through">
                  ¥{subtotal(shop, items) + shop.deliveryFee + packagingFee(items)}
                </span>
              </p>
              <p className="text-[11px] text-gray-400">另需配送费 ¥{shop.deliveryFee}</p>
            </>
          )}
        </div>
      </div>

      {canCheckout ? (
        <button
          onClick={onCheckout}
          className="h-11 rounded-full bg-[#FFD100] px-7 text-sm font-bold text-gray-900 active:scale-95"
        >
          去结算
        </button>
      ) : (
        <div className="h-11 rounded-full bg-[#5A5A5A] px-6 text-sm font-medium leading-[44px] text-gray-300">
          差¥{amountToMinOrder(shop, items)}起送
        </div>
      )}
    </div>
  )
}
