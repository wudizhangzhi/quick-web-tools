import { Star } from 'lucide-react'

/** 五星评分，支持小数（用宽度裁剪做半星），美团橙色星。 */
export default function Stars({ value, size = 12 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(1, value / 5)) * 100
  return (
    <span className="relative inline-flex align-middle" aria-label={`${value} 星`}>
      <span className="flex text-gray-300">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} className="fill-gray-300" strokeWidth={0} />
        ))}
      </span>
      <span className="absolute inset-0 flex overflow-hidden text-[#FF9500]" style={{ width: `${pct}%` }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} className="flex-shrink-0 fill-[#FF9500]" strokeWidth={0} />
        ))}
      </span>
    </span>
  )
}
