'use client'

import { useState } from 'react'
import { ChevronLeft, MapPin, LocateFixed, Search } from 'lucide-react'

const PRESETS = [
  '异次元大厦·收不到货的地方',
  '望京 SOHO·永远找不到的那栋',
  '宇宙中心·五道口',
  '银河系猎户臂·某出租屋 302',
  '公司工位（绿植已成精）',
  '你妈喊你回家吃饭的那张桌子',
  '自己家厨房（最快，但你不去）',
]

const RELOCATE = [
  '定位到：月球背面环形山 3 号',
  '定位到：你梦里的那家店楼下',
  '定位到：薛定谔的家（在与不在叠加态）',
  '定位漂移中…骑手已跟丢',
]

export default function LocationView({
  current,
  onBack,
  onSelect,
}: {
  current: string
  onBack: () => void
  onSelect: (loc: string) => void
}) {
  const [relocateIdx, setRelocateIdx] = useState(0)
  const [located, setLocated] = useState<string | null>(null)

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]">
      <div className="flex items-center gap-2 bg-[#FFD100] px-2 py-3">
        <button onClick={onBack} aria-label="返回" className="p-1 text-gray-900">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-base font-bold text-gray-900">选择收货地址</h1>
      </div>

      {/* 搜索框（装饰） */}
      <div className="bg-white px-3 py-3">
        <div className="flex items-center rounded-full bg-gray-100 px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <span className="ml-2 text-sm text-gray-400">搜索地点（搜到了骑手也找不到）</span>
        </div>
        <button
          onClick={() => {
            const loc = RELOCATE[relocateIdx % RELOCATE.length]
            setRelocateIdx((i) => i + 1)
            setLocated(loc)
          }}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#FF6000]"
        >
          <LocateFixed size={16} /> 重新定位当前位置
        </button>
        {located && <p className="mt-2 text-xs text-gray-500">📍 {located}</p>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="px-4 py-2 text-xs text-gray-400">当前：{current}</p>
        {PRESETS.map((p) => {
          const active = p === current
          return (
            <button
              key={p}
              onClick={() => onSelect(p)}
              className="flex w-full items-center gap-3 border-b border-gray-50 bg-white px-4 py-3.5 text-left active:bg-gray-50"
            >
              <MapPin size={18} className={active ? 'text-[#FF6000]' : 'text-gray-400'} />
              <span className={`flex-1 text-sm ${active ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{p}</span>
              {active && <span className="text-xs text-[#FF6000]">当前</span>}
            </button>
          )
        })}
        {located && (
          <button
            onClick={() => onSelect(located)}
            className="flex w-full items-center gap-3 border-b border-gray-50 bg-white px-4 py-3.5 text-left active:bg-gray-50"
          >
            <LocateFixed size={18} className="text-[#FF6000]" />
            <span className="flex-1 text-sm text-gray-700">{located}</span>
            <span className="text-xs text-gray-400">使用此定位</span>
          </button>
        )}
        <p className="py-4 text-center text-xs text-gray-300">—— 选哪都一样，反正送不到 ——</p>
      </div>
    </div>
  )
}
