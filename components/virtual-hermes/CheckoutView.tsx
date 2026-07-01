'use client'

import { ChevronLeft } from 'lucide-react'
import type { CartLineDetail } from '@/lib/virtual-hermes/cart'
import type { Address } from '@/lib/virtual-hermes/order'
import { formatPrice } from '@/lib/virtual-hermes/data'

export default function CheckoutView({
  lines,
  total,
  address,
  onAddressChange,
  onBack,
  onSubmit,
}: {
  lines: CartLineDetail[]
  total: number
  address: Address
  onAddressChange: (a: Address) => void
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <div className="bg-hermes-cream min-h-[60vh] px-[6.875%] py-6">
      <button onClick={onBack} className="mb-6 flex items-center gap-1 text-xs text-hermes-muted">
        <ChevronLeft size={16} /> 返回购物袋
      </button>

      <h1 className="text-xl font-light" style={{ fontWeight: 440 }}>
        结算
      </h1>

      <section className="mt-8">
        <h2 className="text-sm font-medium">配送地址</h2>
        <div className="mt-3 space-y-3">
          <input
            placeholder="收货人"
            value={address.name}
            onChange={(e) => onAddressChange({ ...address, name: e.target.value })}
            className="w-full border-b border-hermes-grey/50 bg-transparent py-2 text-sm outline-none"
          />
          <input
            placeholder="手机号"
            value={address.phone}
            onChange={(e) => onAddressChange({ ...address, phone: e.target.value })}
            className="w-full border-b border-hermes-grey/50 bg-transparent py-2 text-sm outline-none"
          />
          <input
            placeholder="详细地址"
            value={address.detail}
            onChange={(e) => onAddressChange({ ...address, detail: e.target.value })}
            className="w-full border-b border-hermes-grey/50 bg-transparent py-2 text-sm outline-none"
          />
        </div>
      </section>

      <section className="mt-8 border-t border-hermes-grey/30 pt-6">
        <h2 className="text-sm font-medium">订单明细</h2>
        <ul className="mt-4 space-y-4">
          {lines.map((l) => (
            <li key={`${l.product.id}-${l.size}`} className="flex gap-3 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.product.image} alt="" className="h-16 w-16 object-cover bg-hermes-cream-light" />
              <div className="flex-1">
                <p>{l.product.name}</p>
                <p className="text-hermes-muted">尺码 {l.size} · x{l.qty}</p>
                <p className="mt-1">{formatPrice(l.subtotal)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-between border-t border-hermes-grey/30 pt-4 text-sm">
          <span>合计</span>
          <span className="font-medium">{formatPrice(total)}</span>
        </div>
        <p className="mt-2 text-[10px] text-hermes-muted">免费标准配送 · 橙色礼盒包装</p>
      </section>

      <button
        onClick={onSubmit}
        disabled={!address.name || !address.phone || !address.detail}
        className="mt-8 w-full bg-black py-4 text-xs uppercase tracking-[0.15em] text-white disabled:opacity-40"
      >
        确认订单
      </button>
    </div>
  )
}