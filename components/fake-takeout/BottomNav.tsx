'use client'

import { Home, FileText, User, Crown } from 'lucide-react'

export type MainTab = 'home' | 'member' | 'orders' | 'profile'

/** 首页底部 Tab，四个都是真实页面。 */
export default function BottomNav({
  active,
  onNavigate,
  orderCount = 0,
}: {
  active: MainTab
  onNavigate: (tab: MainTab) => void
  orderCount?: number
}) {
  const items: { key: MainTab; icon: typeof Home; label: string }[] = [
    { key: 'home', icon: Home, label: '首页' },
    { key: 'member', icon: Crown, label: '会员' },
    { key: 'orders', icon: FileText, label: '订单' },
    { key: 'profile', icon: User, label: '我的' },
  ]
  return (
    <div className="flex border-t border-gray-100 bg-white">
      {items.map((it) => {
        const Icon = it.icon
        const on = active === it.key
        return (
          <button
            key={it.key}
            onClick={() => onNavigate(it.key)}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
              on ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <Icon size={20} className={on ? 'fill-[#FFD100] text-gray-900' : ''} />
            {it.label}
            {it.key === 'orders' && orderCount > 0 && (
              <span className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4E12] px-1 text-[9px] font-bold text-white">
                {orderCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
