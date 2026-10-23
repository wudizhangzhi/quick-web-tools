'use client'

import { Plus, Minus, Maximize } from 'lucide-react'
import type { PaperScene } from './scene'

// + / − / fit buttons over the 3D view. Wheel, pinch and double-tap also zoom.
export default function ZoomControls({ scene, className = '' }: { scene: PaperScene | null; className?: string }) {
  const btn =
    'grid h-9 w-9 place-items-center text-gray-800 hover:bg-white active:scale-95 transition disabled:opacity-40'
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl bg-white/85 shadow-lg backdrop-blur divide-y divide-gray-200 ${className}`}>
      <button type="button" aria-label="放大" title="放大" disabled={!scene} onClick={() => scene?.zoomBy(1.5)} className={btn}>
        <Plus size={18} />
      </button>
      <button type="button" aria-label="缩小" title="缩小" disabled={!scene} onClick={() => scene?.zoomBy(1 / 1.5)} className={btn}>
        <Minus size={18} />
      </button>
      <button type="button" aria-label="看整张" title="看整张" disabled={!scene} onClick={() => scene?.resetView()} className={btn}>
        <Maximize size={16} />
      </button>
    </div>
  )
}
