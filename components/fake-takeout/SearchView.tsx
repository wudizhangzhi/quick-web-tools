'use client'

import { useMemo, useState } from 'react'
import { Search, ChevronLeft, X } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import { SHOPS } from '@/lib/fake-takeout/data'
import { event as gaEvent } from '@/lib/gtag'
import ShopCard from './ShopCard'

const HOT = ['炸鸡', '麻辣烫', '奶茶', '螺蛳粉', '火锅', '永远收不到']

export default function SearchView({
  onBack,
  onSelectShop,
}: {
  onBack: () => void
  onSelectShop: (shop: Shop) => void
}) {
  const [q, setQ] = useState('')
  const query = q.trim()

  const results = useMemo<{ shop: Shop; hitDishes: string[] }[]>(() => {
    if (!query) return []
    return SHOPS.map((shop) => {
      const inName = shop.name.includes(query)
      const hitDishes = shop.dishes.filter((d) => d.name.includes(query)).map((d) => d.name)
      if (inName || hitDishes.length) return { shop, hitDishes: hitDishes.slice(0, 3) }
      return null
    }).filter(Boolean) as { shop: Shop; hitDishes: string[] }[]
  }, [query])

  function submit(term: string) {
    const t = term.trim()
    setQ(t)
    if (t) {
      const n = SHOPS.filter(
        (s) => s.name.includes(t) || s.dishes.some((d) => d.name.includes(t))
      ).length
      gaEvent('fake_takeout_search', { results: n })
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]">
      {/* 搜索头 */}
      <div className="flex items-center gap-2 bg-white px-2 py-2">
        <button onClick={onBack} aria-label="返回" className="p-1 text-gray-700">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-1 items-center rounded-full bg-gray-100 px-3 py-1.5">
          <Search size={16} className="text-gray-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit(q)}
            placeholder="搜店铺 / 菜名（搜到了也收不到）"
            className="ml-2 flex-1 bg-transparent text-sm outline-none"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="清空">
              <X size={15} className="text-gray-400" />
            </button>
          )}
        </div>
        <button onClick={() => submit(q)} className="px-1 text-sm font-medium text-gray-700">
          搜索
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!query ? (
          <div className="p-4">
            <p className="mb-3 text-sm font-bold text-gray-700">大家在搜（虽然都搜不到货）</p>
            <div className="flex flex-wrap gap-2">
              {HOT.map((h) => (
                <button
                  key={h}
                  onClick={() => submit(h)}
                  className="rounded-full bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-gray-400">
            没搜到「{query}」相关的店，换个词试试 🔍
          </p>
        ) : (
          <>
            <p className="px-4 py-2 text-xs text-gray-400">找到 {results.length} 家相关店铺</p>
            {results.map(({ shop, hitDishes }) => (
              <div key={shop.id}>
                <ShopCard shop={shop} onSelect={() => onSelectShop(shop)} />
                {hitDishes.length > 0 && (
                  <div className="-mt-px flex flex-wrap gap-1.5 bg-white px-3 pb-2.5">
                    {hitDishes.map((d) => (
                      <span key={d} className="rounded bg-[#FFF1E8] px-1.5 py-0.5 text-[11px] text-[#FF6000]">
                        含「{d}」
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
