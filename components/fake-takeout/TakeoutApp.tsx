'use client'

import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { event as gaEvent } from '@/lib/gtag'
import type { Shop } from '@/lib/fake-takeout/types'
import { findShop } from '@/lib/fake-takeout/data'
import { addToCart, removeFromCart, type CartItem } from '@/lib/fake-takeout/cart'
import { formatOrderNo } from '@/lib/fake-takeout/order'
import HomeView from './HomeView'
import ShopView from './ShopView'
import CheckoutView, { type Address } from './CheckoutView'
import TrackingView from './TrackingView'
import BottomNav from './BottomNav'

type View = 'home' | 'shop' | 'checkout' | 'tracking'

const STORAGE_KEY = 'fake-takeout-v2'
const EMPTY_ADDRESS: Address = { name: '', phone: '', detail: '' }

interface Persisted {
  shopId: string | null
  items: CartItem[]
  address: Address
  remark: string
}

export default function TakeoutApp() {
  const [view, setView] = useState<View>('home')
  const [shopId, setShopId] = useState<string | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS)
  const [remark, setRemark] = useState('')
  const [order, setOrder] = useState<{ no: string; startMs: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // 客户端水合
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as Persisted
      if (data.shopId) setShopId(data.shopId)
      if (Array.isArray(data.items)) setItems(data.items)
      if (data.address) setAddress({ ...EMPTY_ADDRESS, ...data.address })
      if (typeof data.remark === 'string') setRemark(data.remark)
    } catch {
      /* 忽略坏数据 */
    }
  }, [])

  // 持久化
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ shopId, items, address, remark } satisfies Persisted))
    } catch {
      /* 忽略 */
    }
  }, [shopId, items, address, remark])

  const shop: Shop | undefined = shopId ? findShop(shopId) : undefined

  function selectShop(next: Shop) {
    if (next.id !== shopId) {
      setShopId(next.id)
      setItems([])
    }
    setView('shop')
  }

  function placeOrder() {
    const startMs = Date.now()
    setOrder({ no: formatOrderNo(startMs), startMs })
    setView('tracking')
    gaEvent('fake_takeout_order', { status: 'placed' })
    confetti({ particleCount: 60, spread: 70, startVelocity: 34, origin: { y: 0.6 }, scalar: 0.9 })
  }

  function backToHome() {
    setView('home')
    setOrder(null)
    setItems([])
  }

  function showToast(label: string) {
    setToast(`「${label}」还没做，这是个画饼网站 🫓`)
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="relative mx-auto flex h-[100dvh] max-w-[440px] flex-col overflow-hidden bg-white shadow-xl">
      {view === 'home' && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <HomeView onSelectShop={selectShop} />
          </div>
          <BottomNav onFake={showToast} />
        </>
      )}

      {view === 'shop' && shop && (
        <div className="min-h-0 flex-1">
          <ShopView
            shop={shop}
            items={items}
            onAdd={(id) => setItems((c) => addToCart(c, id))}
            onRemove={(id) => setItems((c) => removeFromCart(c, id))}
            onBack={() => setView('home')}
            onCheckout={() => setView('checkout')}
            onClear={() => setItems([])}
          />
        </div>
      )}

      {view === 'checkout' && shop && (
        <div className="relative min-h-0 flex-1">
          <CheckoutView
            shop={shop}
            items={items}
            address={address}
            onAddressChange={setAddress}
            remark={remark}
            onRemarkChange={setRemark}
            onBack={() => setView('shop')}
            onSubmit={placeOrder}
          />
        </div>
      )}

      {view === 'tracking' && shop && order && (
        <div className="relative min-h-0 flex-1">
          <TrackingView
            shop={shop}
            items={items}
            orderNo={order.no}
            startMs={order.startMs}
            address={address}
            onBack={backToHome}
          />
        </div>
      )}

      {toast && (
        <div className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/80 px-4 py-2.5 text-center text-sm text-white">
          {toast}
        </div>
      )}
    </div>
  )
}
