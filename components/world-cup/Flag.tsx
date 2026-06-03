import { flagUrl } from '@/lib/world-cup/flags'

/* Rectangular national flag (flagcdn.com) keyed on the 3-letter code (MEX, ENG…).
   Size the rectangle via className (e.g. "h-14 w-20"); undecided / unmapped
   slots render a neutral badge. */
export default function Flag({
  code,
  className = '',
  alt,
  width = 160,
}: {
  code: string | null
  className?: string
  alt?: string
  width?: 40 | 80 | 160 | 320
}) {
  const url = flagUrl(code, width)
  if (!url) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 text-gray-400 ${className}`}
        aria-label="待定"
      >
        <span className="text-[0.7em] font-bold leading-none">?</span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt ?? code ?? ''} loading="lazy" className={`object-cover ${className}`} />
  )
}
