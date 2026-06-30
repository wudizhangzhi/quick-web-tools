'use client'

import { MapPin, User, Phone } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import type { CartItem } from '@/lib/fake-takeout/cart'
import { cartLines, subtotal, total } from '@/lib/fake-takeout/cart'

export interface Address {
  name: string
  phone: string
  detail: string
}

export default function CheckoutView({
  shop,
  items,
  address,
  onAddressChange,
}: {
  shop: Shop
  items: CartItem[]
  address: Address
  onAddressChange: (a: Address) => void
}) {
  const lines = cartLines(shop, items)

  return (
    <div className="space-y-3 p-3">
      {/* 收货地址 */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800">
          <MapPin size={16} className="text-orange-500" /> 收货地址
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <User size={15} className="text-gray-400" />
            <input
              value={address.name}
              onChange={(e) => onAddressChange({ ...address, name: e.target.value })}
              placeholder="收货人姓名"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <Phone size={15} className="text-gray-400" />
            <input
              value={address.phone}
              onChange={(e) => onAddressChange({ ...address, phone: e.target.value })}
              placeholder="手机号"
              inputMode="numeric"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <label className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <MapPin size={15} className="mt-0.5 text-gray-400" />
            <textarea
              value={address.detail}
              onChange={(e) => onAddressChange({ ...address, detail: e.target.value })}
              placeholder="详细地址（楼栋 / 门牌号 / 你以为能找到的地方）"
              rows={2}
              className="w-full resize-none bg-transparent text-sm outline-none"
            />
          </label>
        </div>
      </div>

      {/* 订单明细 */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-bold text-gray-800">{shop.name}</p>
        {lines.map((line) => (
          <div key={line.dish.id} className="flex justify-between py-1 text-sm text-gray-600">
            <span className="truncate pr-2">
              {line.dish.emoji} {line.dish.name} × {line.qty}
            </span>
            <span>¥{line.subtotal}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm text-gray-500">
          <span>配送费</span>
          <span>¥{shop.deliveryFee}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm font-bold text-gray-800">
          <span>合计</span>
          <span className="text-rose-500">¥{total(shop, items)}</span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          实付 ¥{total(shop, items)}（其中精神食粮 ¥{subtotal(shop, items)}）
        </p>
      </div>
    </div>
  )
}
