'use client'

import confetti from 'canvas-confetti'
import { Crown, Ticket, Truck, Headphones, Zap, ChevronRight } from 'lucide-react'
import StatusBar from './StatusBar'

const PERKS = [
  { icon: Ticket, title: '每月 8 张红包', desc: '张张都用不出去' },
  { icon: Truck, title: '免配送费券', desc: '反正也没骑手送' },
  { icon: Zap, title: '极速退款', desc: '比到货还快（废话）' },
  { icon: Headphones, title: '专属客服', desc: '专门陪你一起等' },
]

const COUPONS = [
  { amount: '满20减18', tag: '已过期', note: '过期于你下单那一刻' },
  { amount: '0 元配送', tag: '不可用', note: '需先收到货（做不到）' },
  { amount: '免单券', tag: '已抢光', note: '被骑手在路上吃了' },
]

export default function MemberView({ onActivate }: { onActivate: () => void }) {
  return (
    <div className="min-h-full bg-[#2A2118]">
      <div className="bg-gradient-to-b from-[#3A2E1C] to-[#2A2118] px-4 pb-6">
        <StatusBar />
        <h1 className="px-1 py-2 text-lg font-bold text-[#FFE08A]">超级会员</h1>

        {/* 开通卡 */}
        <div className="rounded-2xl bg-gradient-to-br from-[#FFE9B0] to-[#F4C463] p-4 text-[#5A3B00] shadow-lg">
          <div className="flex items-center gap-2">
            <Crown size={26} className="fill-[#B8860B] text-[#B8860B]" />
            <div>
              <p className="text-base font-bold">开通画饼 SVIP</p>
              <p className="text-xs opacity-80">尊享「依然收不到货，但收得更体面」</p>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <p>
              <span className="text-sm">限时 </span>
              <span className="text-3xl font-bold">¥0</span>
              <span className="text-sm"> /月</span>
              <span className="ml-2 text-xs line-through opacity-60">¥25</span>
            </p>
            <button
              onClick={() => {
                confetti({ particleCount: 50, spread: 65, startVelocity: 30, origin: { y: 0.5 }, scalar: 0.9 })
                onActivate()
              }}
              className="rounded-full bg-[#3A2E1C] px-6 py-2 text-sm font-bold text-[#FFE08A] active:scale-95"
            >
              立即开通
            </button>
          </div>
        </div>
      </div>

      {/* 权益 */}
      <div className="px-4">
        <div className="-mt-2 rounded-2xl bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-gray-900">会员专享权益</h2>
          <div className="grid grid-cols-4 gap-2">
            {PERKS.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.title} className="flex flex-col items-center text-center">
                  <Icon size={24} className="text-[#C8901E]" />
                  <p className="mt-1 text-[11px] font-medium text-gray-800">{p.title}</p>
                  <p className="text-[10px] leading-tight text-gray-400">{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 券包 */}
      <div className="p-4">
        <h2 className="mb-2 px-1 text-sm font-bold text-[#FFE08A]">我的券包</h2>
        <div className="space-y-2">
          {COUPONS.map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-3 opacity-70">
              <div className="flex h-12 w-16 flex-col items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                <span className="text-xs font-bold">{c.amount}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">{c.note}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400">{c.tag}</span>
            </div>
          ))}
        </div>
        <button className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-[#A8895A]">
          查看全部 0 张可用券 <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
