'use client'

import { X, Minus, Plus } from 'lucide-react'
import type { CartLineDetail } from '@/lib/virtual-hermes/cart'
import { formatPrice } from '@/lib/virtual-hermes/data'

export default function CartSheet({
  open,
  lines,
  total,
  onClose,
  onDecQty,
  onAddQty,
  onRemoveLine,
  onProduct,
  onCheckout,
}: {
  open: boolean
  lines: CartLineDetail[]
  total: number
  onClose: () => void
  onDecQty: (productId: string, size: string) => void
  onAddQty: (productId: string, size: string) => void
  onRemoveLine: (productId: string, size: string) => void
  onProduct: (productId: string) => void
  onCheckout: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-hermes-cream-light"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hermes-grey/30 px-6 py-4">
          <h2 className="text-sm font-medium">购物袋</h2>
          <button onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-6 text-sm text-hermes-muted">
            您的购物袋是空的
          </p>
        ) : (
          <ul className="flex-1 overflow-y-auto px-6 py-4">
            {lines.map((l) => (
              <li key={`${l.product.id}-${l.size}`} className="mb-4 flex gap-3 border-b border-hermes-grey/20 pb-4">
                <button onClick={() => onProduct(l.product.id)} className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.product.image} alt="" className="h-20 w-20 bg-hermes-cream object-cover" />
                </button>
                <div className="min-w-0 flex-1">
                  <button onClick={() => onProduct(l.product.id)} className="text-left text-xs hover:underline">
                    {l.product.name}
                  </button>
                  <p className="mt-1 text-xs text-hermes-muted">尺码 {l.size}</p>
                  <p className="mt-1 text-xs">{formatPrice(l.subtotal)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => onDecQty(l.product.id, l.size)}
                      className="flex h-6 w-6 items-center justify-center border border-hermes-grey/50"
                      aria-label="减少"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs">{l.qty}</span>
                    <button
                      onClick={() => onAddQty(l.product.id, l.size)}
                      className="flex h-6 w-6 items-center justify-center border border-hermes-grey/50"
                      aria-label="增加"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => onRemoveLine(l.product.id, l.size)}
                      className="ml-auto text-[10px] text-hermes-muted underline"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 && (
          <div className="border-t border-hermes-grey/30 px-6 py-4">
            <p className="text-sm">
              合计 <span className="font-medium">{formatPrice(total)}</span>
            </p>
            <button
              onClick={onCheckout}
              className="mt-4 w-full bg-black py-3 text-xs uppercase tracking-wider text-white"
            >
              结算
            </button>
          </div>
        )}
      </div>
    </div>
  )
}