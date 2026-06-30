'use client'

import { ChevronRight, Wallet, Ticket, Gift, Star, MapPin, Headphones, Settings, Info, Crown } from 'lucide-react'
import StatusBar from './StatusBar'

export default function ProfileView({
  orderCount,
  onOpenOrders,
  onOpenMember,
  onFake,
}: {
  orderCount: number
  onOpenOrders: () => void
  onOpenMember: () => void
  onFake: (label: string) => void
}) {
  const wallet = [
    { icon: Wallet, label: '钱包', value: '¥0.00' },
    { icon: Gift, label: '红包', value: '0' },
    { icon: Ticket, label: '优惠券', value: '0' },
    { icon: Star, label: '积分', value: '999+' },
  ]
  const orderEntries = [
    { label: '待付款', n: 0 },
    { label: '待收货', n: orderCount },
    { label: '已完成', n: 0 },
    { label: '退款/售后', n: 0 },
  ]
  const menu = [
    { icon: MapPin, label: '收货地址管理' },
    { icon: Headphones, label: '我的客服（陪聊不送货）' },
    { icon: Settings, label: '设置' },
    { icon: Info, label: '关于画饼外卖' },
  ]

  return (
    <div className="min-h-full bg-[#F5F5F5]">
      {/* 头部 */}
      <div className="bg-gradient-to-br from-[#FFD100] to-[#FFB000] px-4 pb-6">
        <StatusBar dark />
        <div className="flex items-center gap-3 px-1 pt-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-4xl shadow">🤤</span>
          <div className="flex-1">
            <p className="flex items-center gap-2 text-lg font-bold text-gray-900">
              祖传饿货
              <span className="flex items-center gap-0.5 rounded-full bg-[#3A2E1C] px-2 py-0.5 text-[10px] text-[#FFE08A]">
                <Crown size={10} /> SVIP
              </span>
            </p>
            <p className="mt-0.5 text-xs text-gray-700">已下单 {orderCount} 单 · 到货 0 单 · 节省 ¥∞</p>
          </div>
          <ChevronRight size={18} className="text-gray-700" />
        </div>
      </div>

      {/* 钱包 */}
      <div className="mx-2.5 -mt-3 rounded-2xl bg-white py-4">
        <div className="grid grid-cols-4">
          {wallet.map((w) => {
            const Icon = w.icon
            return (
              <button key={w.label} onClick={() => onFake(w.label)} className="flex flex-col items-center">
                <Icon size={20} className="text-[#FF8A00]" />
                <span className="mt-1 text-sm font-bold text-gray-900">{w.value}</span>
                <span className="text-[11px] text-gray-400">{w.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 我的订单 */}
      <div className="mx-2.5 mt-2.5 rounded-2xl bg-white p-4">
        <button onClick={onOpenOrders} className="flex w-full items-center justify-between">
          <span className="text-sm font-bold text-gray-900">我的订单</span>
          <span className="flex items-center text-xs text-gray-400">全部订单 <ChevronRight size={13} /></span>
        </button>
        <div className="mt-3 grid grid-cols-4">
          {orderEntries.map((e) => (
            <button key={e.label} onClick={onOpenOrders} className="relative flex flex-col items-center gap-1">
              <span className="text-2xl">{e.label === '待收货' ? '🛵' : e.label === '待付款' ? '💸' : e.label === '已完成' ? '✅' : '↩️'}</span>
              <span className="text-[11px] text-gray-600">{e.label}</span>
              {e.n > 0 && (
                <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4E12] px-1 text-[10px] font-bold text-white">
                  {e.n}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SVIP 横幅 */}
      <button
        onClick={onOpenMember}
        className="mx-2.5 mt-2.5 flex w-[calc(100%-20px)] items-center justify-between rounded-2xl bg-gradient-to-r from-[#3A2E1C] to-[#5A4528] p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Crown size={22} className="fill-[#FFE08A] text-[#FFE08A]" />
          <div>
            <p className="text-sm font-bold text-[#FFE08A]">开通画饼 SVIP</p>
            <p className="text-[11px] text-[#C8A86A]">收不到货，但收得更体面</p>
          </div>
        </div>
        <span className="rounded-full bg-[#FFE08A] px-3 py-1 text-xs font-bold text-[#5A3B00]">立即开通</span>
      </button>

      {/* 菜单 */}
      <div className="mx-2.5 my-2.5 overflow-hidden rounded-2xl bg-white">
        {menu.map((m) => {
          const Icon = m.icon
          return (
            <button
              key={m.label}
              onClick={() => onFake(m.label)}
              className="flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3.5 text-left last:border-0"
            >
              <Icon size={18} className="text-gray-400" />
              <span className="flex-1 text-sm text-gray-700">{m.label}</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          )
        })}
      </div>

      <p className="pb-4 text-center text-xs text-gray-300">画饼外卖 · 只画饼，不送达</p>
    </div>
  )
}
