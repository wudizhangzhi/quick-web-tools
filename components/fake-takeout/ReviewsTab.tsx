'use client'

import { useState } from 'react'
import type { Shop } from '@/lib/fake-takeout/types'
import Stars from './Stars'

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <span>{label}</span>
      <span className="font-bold text-[#FF6000]">{value.toFixed(1)}</span>
    </div>
  )
}

export default function ReviewsTab({ shop }: { shop: Shop }) {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const reviews = activeTag
    ? shop.reviews.filter((r) => r.comment.includes(activeTag) || r.dishNames?.some((d) => d.includes(activeTag)))
    : shop.reviews

  return (
    <div className="bg-white">
      {/* 评分概览 */}
      <div className="flex items-center gap-4 border-b border-gray-100 px-4 py-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-[#FF6000]">{shop.rating.toFixed(1)}</p>
          <Stars value={shop.rating} size={12} />
          <p className="mt-1 text-[11px] text-gray-400">综合评分</p>
        </div>
        <div className="flex flex-col gap-1.5 border-l border-gray-100 pl-4">
          <ScoreItem label="口味" value={shop.scores.taste} />
          <ScoreItem label="包装" value={shop.scores.packaging} />
          <ScoreItem label="配送" value={shop.scores.delivery} />
        </div>
      </div>

      {/* 标签 */}
      {shop.reviewTags.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-4 py-3">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-2.5 py-1 text-xs ${
              activeTag === null ? 'bg-[#FFD100] font-medium text-gray-900' : 'bg-gray-100 text-gray-600'
            }`}
          >
            全部 {shop.reviews.length}
          </button>
          {shop.reviewTags.map((t) => (
            <button
              key={t.text}
              onClick={() => setActiveTag(activeTag === t.text ? null : t.text)}
              className={`rounded-full px-2.5 py-1 text-xs ${
                activeTag === t.text
                  ? 'bg-[#FFD100] font-medium text-gray-900'
                  : t.positive
                    ? 'bg-[#FFF1E8] text-[#FF6000]'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t.text} {t.count}
            </button>
          ))}
        </div>
      )}

      {/* 评价列表 */}
      <div>
        {reviews.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">没有符合「{activeTag}」的评价</p>
        ) : (
          reviews.map((r, i) => (
            <div key={i} className="border-b border-gray-50 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-lg">
                  {r.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{r.user}</p>
                  <div className="flex items-center gap-2">
                    <Stars value={r.stars} size={11} />
                    <span className="text-[11px] text-gray-400">{r.time}</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{r.comment}</p>
              {r.images && r.images.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  {r.images.map((img, j) => (
                    <span
                      key={j}
                      className="flex h-16 w-16 items-center justify-center rounded-md bg-orange-50 text-3xl"
                    >
                      {img}
                    </span>
                  ))}
                </div>
              )}
              {r.dishNames && r.dishNames.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.dishNames.map((d) => (
                    <span key={d} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                      {d}
                    </span>
                  ))}
                </div>
              )}
              {r.reply && (
                <div className="mt-2 rounded-lg bg-gray-50 px-2.5 py-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-600">商家回复：</span>
                  {r.reply}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
