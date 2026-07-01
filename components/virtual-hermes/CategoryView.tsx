'use client'

import { ChevronLeft } from 'lucide-react'
import type { CatalogCategory, CatalogProduct } from '@/lib/virtual-hermes/types'
import { formatPrice } from '@/lib/virtual-hermes/data'

export default function CategoryView({
  category,
  products,
  onBack,
  onProduct,
}: {
  category: CatalogCategory
  products: CatalogProduct[]
  onBack: () => void
  onProduct: (id: string) => void
}) {
  return (
    <div className="bg-hermes-cream min-h-[60vh]">
      <div className="border-b border-hermes-grey/30 px-[6.875%] py-6">
        <button onClick={onBack} className="mb-4 flex items-center gap-1 text-xs text-hermes-muted">
          <ChevronLeft size={16} /> 返回
        </button>
        <h1 className="text-2xl font-light" style={{ fontWeight: 440 }}>
          {category.label}
        </h1>
        <p className="mt-1 text-xs text-hermes-muted">{products.length} 件货品</p>
      </div>

      <div className="mx-auto grid max-w-hermes grid-cols-2 gap-x-4 gap-y-8 px-[6.875%] py-8 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <button key={p.id} onClick={() => onProduct(p.id)} className="group text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt={p.name}
              className="aspect-square w-full bg-hermes-cream-light object-cover transition group-hover:opacity-90"
            />
            <p className="mt-3 text-xs leading-snug">{p.name}</p>
            {p.color && <p className="text-xs text-hermes-muted">, {p.color}</p>}
            <p className="mt-1 text-xs">
              <span className="text-hermes-muted">价格 </span>
              {formatPrice(p.price)}
            </p>
            {p.comingSoon && <span className="mt-1 block text-[10px] text-hermes-muted">即将上市</span>}
          </button>
        ))}
      </div>

      {products.length === 0 && (
        <p className="py-20 text-center text-sm text-hermes-muted">该分类暂无货品（或抓取失败）</p>
      )}
    </div>
  )
}