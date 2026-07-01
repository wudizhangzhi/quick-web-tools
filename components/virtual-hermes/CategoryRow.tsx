'use client'

import type { CategoryLink } from '@/lib/virtual-hermes/types'

export default function CategoryRow({
  items,
  onSelect,
}: {
  items: CategoryLink[]
  onSelect: (categoryId: string) => void
}) {
  return (
    <section className="bg-hermes-cream px-[6.875%] py-12">
      <ul className="mx-auto flex max-w-hermes flex-wrap justify-center gap-x-10 gap-y-8">
        {items.map((item) => (
          <li key={item.label} className="w-[calc(50%-20px)] text-center sm:w-[calc(25%-30px)] lg:w-[calc(12.5%-35px)]">
            <button
              onClick={() => item.categoryId && onSelect(item.categoryId)}
              className="group w-full"
              disabled={!item.categoryId}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.label}
                className="aspect-square w-full bg-hermes-cream-light object-cover transition group-hover:opacity-90"
              />
              <span className="mt-2 block text-xs text-black">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}