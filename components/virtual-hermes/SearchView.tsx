'use client'

import { useState } from 'react'
import { ChevronLeft, Search } from 'lucide-react'
import { searchProducts } from '@/lib/virtual-hermes/catalog'
import { formatPrice } from '@/lib/virtual-hermes/data'
import { event as gaEvent } from '@/lib/gtag'

export default function SearchView({
  onBack,
  onProduct,
}: {
  onBack: () => void
  onProduct: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const results = query.trim() ? searchProducts(query) : []

  function submit() {
    if (query.trim()) gaEvent('virtual_hermes_search', { results: results.length })
  }

  return (
    <div className="bg-hermes-cream min-h-[60vh]">
      <div className="border-b border-hermes-grey/30 px-4 py-4">
        <button onClick={onBack} className="mb-4 flex items-center gap-1 text-xs text-hermes-muted">
          <ChevronLeft size={16} /> 返回
        </button>
        <div className="flex items-center gap-2 border-b border-black pb-2">
          <Search size={18} className="text-hermes-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="搜索产品"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="px-[6.875%] py-6">
        {query && (
          <p className="mb-4 text-xs text-hermes-muted">
            {results.length} 个结果
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {results.map((p) => (
            <button key={p.id} onClick={() => onProduct(p.id)} className="text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="aspect-square w-full object-cover bg-hermes-cream-light" />
              <p className="mt-2 text-xs">{p.name}</p>
              <p className="text-xs text-hermes-muted">{formatPrice(p.price)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}