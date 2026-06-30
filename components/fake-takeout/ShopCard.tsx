'use client'

import type { Shop } from '@/lib/fake-takeout/types'
import DishThumb from './DishThumb'
import Stars from './Stars'

/** 促销标签配色（满减/折扣红，赠品/新客等用其它色）。 */
function PromoTag({ text, type }: { text: string; type: string }) {
  const red = type === 'manjian' || type === 'discount'
  return (
    <span
      className={`rounded-[3px] border px-1 py-px text-[10px] leading-tight ${
        red ? 'border-[#FFD0C4] text-[#FF4E12]' : 'border-[#FFE0A3] text-[#FF8A00]'
      }`}
    >
      {text}
    </span>
  )
}

export default function ShopCard({ shop, onSelect }: { shop: Shop; onSelect: () => void }) {
  const topDishes = shop.dishes.slice(0, 3)
  return (
    <button
      onClick={onSelect}
      className="flex w-full gap-2.5 border-b border-gray-100 bg-white p-3 text-left active:bg-gray-50"
    >
      <DishThumb
        image={shop.logoImage}
        emoji={shop.logo}
        alt={shop.name}
        className="h-[68px] w-[68px] flex-shrink-0 rounded-lg"
        emojiClassName="text-4xl"
      />

      <div className="min-w-0 flex-1">
        {/* 店名 + 资质 */}
        <div className="flex items-center gap-1">
          <span className="truncate text-[15px] font-bold text-gray-900">{shop.name}</span>
          {shop.badges.includes('品质联盟') && (
            <span className="flex-shrink-0 rounded-[3px] bg-[#E8F0FF] px-1 text-[10px] text-[#3D7EFF]">品质联盟</span>
          )}
        </div>

        {/* 评分 月售 人均 */}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500">
          <Stars value={shop.rating} size={11} />
          <span className="font-medium text-[#FF6000]">{shop.rating.toFixed(1)}</span>
          <span>月售{shop.monthlySales > 9999 ? '9999+' : shop.monthlySales}</span>
          <span>人均¥{shop.perCapita}</span>
        </div>

        {/* 配送信息 */}
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-gray-500">
          {shop.badges.includes('蜂鸟专送') ? (
            <span className="rounded-[3px] bg-[#0DC2C2] px-1 text-[10px] text-white">蜂鸟专送</span>
          ) : (
            <span className="rounded-[3px] bg-[#FFD100] px-1 text-[10px] text-gray-800">自营专送</span>
          )}
          <span>{shop.deliveryMinutes}分钟</span>
          <span>·</span>
          <span>{shop.distanceKm}km</span>
          <span>·</span>
          <span>起送¥{shop.minOrder}</span>
          <span>·</span>
          <span>
            配送
            {shop.deliveryFeeOriginal && shop.deliveryFeeOriginal > shop.deliveryFee && (
              <span className="text-gray-400 line-through">¥{shop.deliveryFeeOriginal}</span>
            )}
            <span className="text-[#FF4E12]">¥{shop.deliveryFee}</span>
          </span>
        </div>

        {/* 促销 */}
        {shop.promotions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {shop.promotions.slice(0, 4).map((p, i) => (
              <PromoTag key={i} text={p.text} type={p.type} />
            ))}
          </div>
        )}

        {/* 店内推荐 */}
        {topDishes.length > 0 && (
          <div className="mt-2 flex gap-2">
            {topDishes.map((d) => (
              <div key={d.id} className="w-[58px]">
                <DishThumb
                  image={d.image}
                  emoji={d.emoji}
                  alt={d.name}
                  className="h-[58px] w-[58px] rounded-md"
                  emojiClassName="text-3xl"
                />
                <p className="mt-0.5 truncate text-[10px] text-gray-500">{d.name}</p>
                <p className="text-[11px] font-medium text-[#FF4E12]">¥{d.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
