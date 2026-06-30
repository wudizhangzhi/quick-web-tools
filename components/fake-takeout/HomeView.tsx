'use client'

import { useMemo, useState } from 'react'
import { Search, ChevronDown, MapPin, ScanLine } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import { CHANNELS, SHOPS, shopsByChannel, sortShops, type SortKey } from '@/lib/fake-takeout/data'
import StatusBar from './StatusBar'
import ShopCard from './ShopCard'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recommend', label: '综合排序' },
  { key: 'sales', label: '销量优先' },
  { key: 'distance', label: '距离最近' },
  { key: 'rating', label: '评分最高' },
]

export default function HomeView({
  location,
  onSelectShop,
  onOpenSearch,
  onOpenLocation,
}: {
  location: string
  onSelectShop: (shop: Shop) => void
  onOpenSearch: () => void
  onOpenLocation: () => void
}) {
  const [channel, setChannel] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('recommend')

  const shops = useMemo(() => sortShops(shopsByChannel(channel), sort), [channel, sort])

  return (
    <div className="bg-[#F5F5F5]">
      {/* 黄色顶部 */}
      <div className="bg-[#FFD100] px-3 pb-3">
        <StatusBar dark />
        <button
          onClick={onOpenLocation}
          className="flex max-w-full items-center gap-1 px-1 pb-2 pt-1 text-sm font-medium text-gray-900"
        >
          <MapPin size={15} className="flex-shrink-0 fill-gray-900" />
          <span className="truncate font-bold">{location}</span>
          <ChevronDown size={15} className="flex-shrink-0" />
        </button>
        {/* 搜索框 */}
        <button
          onClick={onOpenSearch}
          className="flex w-full items-center rounded-full bg-white py-2 pl-3 pr-1 text-left shadow-sm"
        >
          <Search size={17} className="text-gray-400" />
          <span className="ml-2 flex-1 truncate text-sm text-gray-400">搜索「永远不会到的炸鸡」</span>
          <span className="rounded-full bg-[#FFD100] px-4 py-1 text-xs font-bold text-gray-900">搜索</span>
        </button>
      </div>

      {/* 金刚区 */}
      <div className="bg-white px-1 pb-3 pt-4">
        <div className="grid grid-cols-5 gap-y-4">
          {CHANNELS.map((c) => {
            const active = channel === c.key
            return (
              <button
                key={c.key}
                onClick={() => setChannel(active ? null : c.key)}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition ${
                    active ? 'bg-[#FFF3B0] ring-2 ring-[#FFD100]' : 'bg-[#FFF9E0]'
                  }`}
                >
                  {c.emoji}
                </span>
                <span className={`text-[11px] ${active ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{c.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Banner */}
      <div className="px-3 py-3">
        <div className="flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF4E12] px-4 py-3 text-white">
          <div>
            <p className="text-base font-bold">超级会员 0 元领</p>
            <p className="mt-0.5 text-xs text-white/90">每月 8 张券 · 张张用不出去</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#FF4E12]">立即开通</span>
        </div>
      </div>

      {/* 排序筛选条 */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-gray-100 bg-white px-4 py-2.5 text-[13px]">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={sort === s.key ? 'font-bold text-gray-900' : 'text-gray-500'}
          >
            {s.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-0.5 text-gray-500">
          筛选 <ScanLine size={13} />
        </span>
      </div>

      {/* 列表 */}
      <div>
        {channel && (
          <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500">
            <span>「{channel}」共 {shops.length} 家</span>
            <button onClick={() => setChannel(null)} className="text-[#FF6000]">查看全部</button>
          </div>
        )}
        {shops.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-gray-400">
            该频道暂时没有店铺，反正有了也送不到 🤷
          </p>
        ) : (
          shops.map((shop) => <ShopCard key={shop.id} shop={shop} onSelect={() => onSelectShop(shop)} />)
        )}
        <p className="py-5 text-center text-xs text-gray-300">
          —— 已经到底了，{SHOPS.length} 家店都送不到你 ——
        </p>
      </div>
    </div>
  )
}
