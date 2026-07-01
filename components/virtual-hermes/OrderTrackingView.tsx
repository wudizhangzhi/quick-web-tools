'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { CartLineDetail } from '@/lib/virtual-hermes/cart'
import type { Address } from '@/lib/virtual-hermes/order'
import { allocationSnapshot } from '@/lib/virtual-hermes/order'
import { formatPrice } from '@/lib/virtual-hermes/data'

export default function OrderTrackingView({
  orderNo,
  startMs,
  lines,
  payable,
  address,
  onBack,
}: {
  orderNo: string
  startMs: number
  lines: CartLineDetail[]
  payable: number
  address: Address
  onBack: () => void
}) {
  const [snap, setSnap] = useState(() => allocationSnapshot(0))

  useEffect(() => {
    const tick = () => setSnap(allocationSnapshot((Date.now() - startMs) / 1000))
    tick()
    const id = setInterval(tick, 2000)
    return () => clearInterval(id)
  }, [startMs])

  return (
    <div className="bg-hermes-cream min-h-[60vh] px-[6.875%] py-6">
      <button onClick={onBack} className="mb-6 flex items-center gap-1 text-xs text-hermes-muted">
        <ChevronLeft size={16} /> 返回
      </button>

      <h1 className="text-xl font-light" style={{ fontWeight: 440 }}>
        配货追踪
      </h1>
      <p className="mt-1 text-xs text-hermes-muted">订单号 {orderNo}</p>

      <div className="mt-8 rounded-sm border border-hermes-grey/30 bg-white p-6">
        <div className="flex justify-between text-xs">
          <span className="text-hermes-muted">配货进度</span>
          <span>{snap.progress}%</span>
        </div>
        <div className="mt-2 h-1.5 bg-hermes-cream">
          <div className="h-full bg-black transition-all duration-1000" style={{ width: `${snap.progress}%` }} />
        </div>
        <p className="mt-4 text-sm">{snap.status}</p>
        <p className="mt-2 text-xs text-hermes-muted">预计还需 {snap.etaMin} 分钟（永远不会到 100%）</p>
      </div>

      <div className="mt-6 text-xs text-hermes-muted">
        <p>配送至：{address.name} {address.phone}</p>
        <p className="mt-1">{address.detail}</p>
      </div>

      <div className="mt-6 border-t border-hermes-grey/30 pt-4">
        {lines.map((l) => (
          <p key={l.product.id} className="text-xs text-hermes-muted">
            {l.product.name} ×{l.qty}
          </p>
        ))}
        <p className="mt-2 text-sm font-medium">实付 {formatPrice(payable)}</p>
      </div>
    </div>
  )
}