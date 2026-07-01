'use client'

import { ChevronLeft, ChevronRight, MapPin, Clock, Ticket } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import type { CartItem } from '@/lib/fake-takeout/cart'
import { cartLines, feeBreakdown } from '@/lib/fake-takeout/cart'
import type { Address } from '@/lib/fake-takeout/order'
import DishThumb from './DishThumb'

export type { Address }

export default function CheckoutView({
  shop,
  items,
  address,
  onAddressChange,
  remark,
  onRemarkChange,
  onBack,
  onSubmit,
}: {
  shop: Shop
  items: CartItem[]
  address: Address
  onAddressChange: (a: Address) => void
  remark: string
  onRemarkChange: (r: string) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const lines = cartLines(shop, items)
  const fees = feeBreakdown(shop, items)

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]">
      {/* 顶栏 */}
      <div className="flex items-center bg-[#FFD100] px-3 py-3">
        <button onClick={onBack} aria-label="返回" className="-ml-1 p-1 text-gray-900">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-base font-bold text-gray-900">确认订单</h1>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5 pb-24">
        {/* 配送方式 + 时间 */}
        <section className="rounded-xl bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="rounded bg-[#FFD100] px-2 py-0.5 text-xs font-bold text-gray-900">美团专送</span>
            <span className="flex items-center gap-1 text-sm text-gray-700">
              <Clock size={14} className="text-[#FF6000]" /> 尽快送达（约 {shop.deliveryMinutes} 分钟·骗你的）
            </span>
          </div>
        </section>

        {/* 收货地址 */}
        <section className="rounded-xl bg-white p-4">
          <div className="mb-2 flex items-center gap-1 text-sm font-bold text-gray-900">
            <MapPin size={16} className="text-[#FF6000]" /> 收货地址
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={address.name}
                onChange={(e) => onAddressChange({ ...address, name: e.target.value })}
                placeholder="收货人"
                className="w-1/3 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none"
              />
              <input
                value={address.phone}
                onChange={(e) => onAddressChange({ ...address, phone: e.target.value })}
                placeholder="手机号"
                inputMode="numeric"
                className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none"
              />
            </div>
            <textarea
              value={address.detail}
              onChange={(e) => onAddressChange({ ...address, detail: e.target.value })}
              placeholder="详细地址（楼栋/门牌号/你以为骑手能找到的地方）"
              rows={2}
              className="w-full resize-none rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none"
            />
          </div>
        </section>

        {/* 订单明细 */}
        <section className="rounded-xl bg-white p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <DishThumb
              image={shop.logoImage}
              emoji={shop.logo}
              alt={shop.name}
              className="h-6 w-6 flex-shrink-0 rounded"
              emojiClassName="text-base"
            />
            {shop.name}
          </p>
          <div className="space-y-2.5">
            {lines.map((line) => (
              <div key={line.dish.id} className="flex items-center gap-2.5">
                <DishThumb
                  image={line.dish.image}
                  emoji={line.dish.emoji}
                  alt={line.dish.name}
                  className="h-10 w-10 flex-shrink-0 rounded-md"
                  emojiClassName="text-lg"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{line.dish.name}</span>
                <span className="text-xs text-gray-400">x{line.qty}</span>
                <span className="w-14 text-right text-sm text-gray-700">¥{line.subtotal}</span>
              </div>
            ))}
          </div>

          {/* 费用 */}
          <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
            <Row label="小计" value={`¥${fees.subtotal}`} />
            <Row label="餐盒费" value={`¥${fees.packagingFee}`} />
            <Row label="配送费" value={`¥${fees.deliveryFee}`} />
            {fees.discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[#FF4E12]">
                  <Ticket size={13} /> 满减优惠
                </span>
                <span className="text-[#FF4E12]">-¥{fees.discount}</span>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center justify-end gap-1 border-t border-gray-100 pt-2">
            <span className="text-xs text-gray-500">小计</span>
            <span className="text-lg font-bold text-[#FF4E12]">¥{fees.payable}</span>
          </div>
        </section>

        {/* 备注 */}
        <section className="rounded-xl bg-white">
          <button className="flex w-full items-center justify-between px-4 py-3.5 text-sm">
            <span className="text-gray-700">订单备注</span>
            <span className="flex items-center gap-1 text-gray-400">口味、偏好等 <ChevronRight size={15} /></span>
          </button>
          <div className="px-4 pb-3">
            <input
              value={remark}
              onChange={(e) => onRemarkChange(e.target.value)}
              placeholder="给骑手留言（他看不到，因为他在异次元）"
              className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none"
            />
          </div>
        </section>
      </div>

      {/* 底部提交 */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-gray-100 bg-white px-4 py-2.5">
        <div className="text-gray-900">
          <span className="text-xs">合计 </span>
          <span className="text-xl font-bold text-[#FF4E12]">¥{fees.payable}</span>
        </div>
        <button
          onClick={onSubmit}
          className="h-11 rounded-full bg-[#FFD100] px-8 text-base font-bold text-gray-900 active:scale-95"
        >
          提交订单
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-gray-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
