'use client'

import { Plus, Minus } from 'lucide-react'

/** 加减数量控件。qty 为 0 时只显示「+」黄色圆钮（美团点菜样式）。 */
export default function Stepper({
  qty,
  onAdd,
  onRemove,
  size = 26,
}: {
  qty: number
  onAdd: () => void
  onRemove: () => void
  size?: number
}) {
  const dim = { width: size, height: size }
  return (
    <div className="flex items-center gap-1.5">
      {qty > 0 && (
        <>
          <button
            onClick={onRemove}
            aria-label="减少"
            style={dim}
            className="flex items-center justify-center rounded-full border border-[#FFD100] bg-white text-[#FFB100] transition active:scale-90"
          >
            <Minus size={size * 0.6} strokeWidth={3} />
          </button>
          <span className="min-w-4 text-center text-sm font-bold text-gray-800 tabular-nums">{qty}</span>
        </>
      )}
      <button
        onClick={onAdd}
        aria-label="增加"
        style={dim}
        className="flex items-center justify-center rounded-full bg-[#FFD100] text-gray-900 shadow-sm transition active:scale-90"
      >
        <Plus size={size * 0.6} strokeWidth={3} />
      </button>
    </div>
  )
}
