'use client'

import { Home, FileText, User, Crown } from 'lucide-react'

/** 首页底部 Tab（装饰用，只有「首页」是真的）。 */
export default function BottomNav({ onFake }: { onFake: (label: string) => void }) {
  const items = [
    { icon: Home, label: '首页', active: true },
    { icon: Crown, label: '会员', active: false },
    { icon: FileText, label: '订单', active: false },
    { icon: User, label: '我的', active: false },
  ]
  return (
    <div className="flex border-t border-gray-100 bg-white">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <button
            key={it.label}
            onClick={() => !it.active && onFake(it.label)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
              it.active ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <Icon size={20} className={it.active ? 'fill-[#FFD100] text-gray-900' : ''} />
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
