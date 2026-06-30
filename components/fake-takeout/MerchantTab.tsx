'use client'

import { Clock, MapPin, Phone, ShieldCheck } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'

export default function MerchantTab({ shop }: { shop: Shop }) {
  return (
    <div className="space-y-2.5 bg-[#F5F5F5] p-2.5">
      {/* 公告 */}
      <section className="rounded-xl bg-white p-4">
        <h3 className="mb-2 text-sm font-bold text-gray-900">商家公告</h3>
        <p className="text-sm leading-relaxed text-gray-600">{shop.notice}</p>
      </section>

      {/* 服务与资质 */}
      <section className="rounded-xl bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-gray-900">服务与资质</h3>
        <div className="flex flex-wrap gap-2">
          {shop.badges.map((b) => (
            <span key={b} className="flex items-center gap-1 rounded-full bg-[#FFF9E0] px-2.5 py-1 text-xs text-[#A06800]">
              <ShieldCheck size={12} /> {b}
            </span>
          ))}
        </div>
      </section>

      {/* 配送信息 */}
      <section className="rounded-xl bg-white p-4 text-sm">
        <h3 className="mb-3 font-bold text-gray-900">配送 & 营业</h3>
        <ul className="space-y-2.5 text-gray-600">
          <li className="flex items-center gap-2">
            <Clock size={15} className="text-gray-400" />
            号称 {shop.deliveryMinutes} 分钟送达（实测：天荒地老）
          </li>
          <li className="flex items-center gap-2">
            <MapPin size={15} className="text-gray-400" />
            距你 {shop.distanceKm}km · 起送 ¥{shop.minOrder} · 配送 ¥{shop.deliveryFee}
          </li>
          <li className="flex items-center gap-2">
            <Clock size={15} className="text-gray-400" />
            营业时间：00:00 - 24:00（骑手时间：永不打烊地堵在路上）
          </li>
          <li className="flex items-center gap-2">
            <Phone size={15} className="text-gray-400" />
            商家电话：拨通了也催不到货
          </li>
        </ul>
      </section>

      <p className="py-3 text-center text-xs text-gray-300">画饼外卖 · 本商家所有承诺均为画饼</p>
    </div>
  )
}
