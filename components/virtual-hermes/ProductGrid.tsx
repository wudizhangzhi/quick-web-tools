'use client'

import type { CatalogProduct } from '@/lib/virtual-hermes/types'
import { formatPrice } from '@/lib/virtual-hermes/data'

export default function ProductGrid({
  products,
  onProduct,
}: {
  products: CatalogProduct[]
  onProduct: (id: string) => void
}) {
  return (
    <section className="bg-hermes-cream px-[6.875%] py-8">
      <div className="mx-auto grid max-w-hermes grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((p) => (
          <button key={p.id} onClick={() => onProduct(p.id)} className="group text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt={p.name}
              className="aspect-square w-full bg-hermes-cream-light object-cover transition group-hover:opacity-90"
            />
            <p className="mt-3 text-xs leading-snug text-black">
              {p.name}
              {p.color && (
                <>
                  , <span className="text-hermes-muted">{p.color}</span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-black">
              <span className="text-hermes-muted">价格 </span>
              {formatPrice(p.price)}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}