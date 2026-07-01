'use client'

import type { EditorialBlock } from '@/lib/virtual-hermes/types'

export default function EditorialSection({
  block,
  onCta,
}: {
  block: EditorialBlock
  onCta: () => void
}) {
  return (
    <section className="bg-hermes-cream">
      <div className="mx-auto max-w-hermes px-[6.875%] py-12 text-center md:py-16">
        <h2 className="text-xl font-light md:text-2xl" style={{ fontWeight: 440 }}>
          {block.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-black md:text-base">
          {block.description}
        </p>
        <button
          onClick={onCta}
          className="mt-6 text-xs text-hermes-muted underline decoration-hermes-muted underline-offset-4 hover:text-black hover:no-underline"
        >
          {block.cta}
        </button>
      </div>
      {block.image && (
        <div className="w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.image} alt="" className="block h-auto w-full bg-hermes-cream-light object-cover" />
        </div>
      )}
    </section>
  )
}