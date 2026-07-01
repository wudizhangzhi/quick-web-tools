'use client'

export default function HeroSection({
  title,
  description,
  cta,
  poster,
  onCta,
}: {
  title: string
  description: string
  cta: string
  poster: string
  onCta: () => void
}) {
  return (
    <section className="relative aspect-[16/9] max-h-[810px] w-full overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[38%] to-black/55" />

      <div className="absolute bottom-8 left-6 right-6 text-white md:left-12 md:bottom-12 md:max-w-xl">
        <h2 className="text-2xl font-light leading-tight md:text-[32px]" style={{ fontWeight: 440 }}>
          {title}
        </h2>
        <p className="mt-3 text-base leading-relaxed md:text-lg">{description}</p>
        <button
          onClick={onCta}
          className="mt-5 inline-block border-b border-white pb-0.5 text-[11px] uppercase tracking-[1px] hover:opacity-80"
        >
          {cta}
        </button>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-3 text-[10px] text-white/80">
        <button className="hover:text-white">开启声音</button>
        <span>|</span>
        <button className="hover:text-white">暂停视频</button>
      </div>
    </section>
  )
}