'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ShoppingCart } from 'lucide-react'
import confetti from 'canvas-confetti'
import { event as gaEvent } from '@/lib/gtag'
import type { Shop } from '@/lib/fake-takeout/types'
import { findShop } from '@/lib/fake-takeout/menu'
import {
  addToCart,
  removeFromCart,
  cartCount,
  total,
  meetsMinOrder,
  amountToMinOrder,
  type CartItem,
} from '@/lib/fake-takeout/cart'
import { formatOrderNo } from '@/lib/fake-takeout/order'
import ShopList from './ShopList'
import ShopDetail from './ShopDetail'
import CartView from './CartView'
import CheckoutView, { type Address } from './CheckoutView'
import TrackingView from './TrackingView'

type View = 'list' | 'shop' | 'cart' | 'checkout' | 'tracking'

const STORAGE_KEY = 'fake-takeout-v1'
const EMPTY_ADDRESS: Address = { name: '', phone: '', detail: '' }

interface Persisted {
  shopId: string | null
  items: CartItem[]
  address: Address
}

export default function TakeoutApp() {
  const [view, setView] = useState<View>('list')
  const [shopId, setShopId] = useState<string | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS)
  const [order, setOrder] = useState<{ no: string; startMs: number } | null>(null)

  // 客户端水合：读 localStorage（避免 SSR 不一致）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as Persisted
      if (data.shopId) setShopId(data.shopId)
      if (Array.isArray(data.items)) setItems(data.items)
      if (data.address) setAddress({ ...EMPTY_ADDRESS, ...data.address })
    } catch {
      /* 忽略坏数据 */
    }
  }, [])

  // 持久化购物车 / 地址
  useEffect(() => {
    const data: Persisted = { shopId, items, address }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* 配额满等，忽略 */
    }
  }, [shopId, items, address])

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

  function backToList() {
    setView('list')
    setOrder(null)
    setItems([])
  }

  const count = shop ? cartCount(items) : 0
  const canCheckout = shop ? meetsMinOrder(shop, items) : false

  const titles: Record<View, string> = {
    list: '画饼外卖',
    shop: shop?.name ?? '画饼外卖',
    cart: '购物车',
    checkout: '确认订单',
    tracking: '订单配送中',
  }

  function onBack() {
    if (view === 'shop') setView('list')
    else if (view === 'cart') setView('shop')
    else if (view === 'checkout') setView('cart')
    else if (view === 'tracking') backToList()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-orange-50/60">
      {/* 顶栏 */}
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-white/90 px-3 py-3 backdrop-blur">
        {view !== 'list' ? (
          <button onClick={onBack} aria-label="返回" className="-ml-1 p-1 text-gray-700">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <span className="text-xl">🥡</span>
        )}
        <h1 className="truncate text-base font-bold text-gray-900">{titles[view]}</h1>
      </header>

      {/* 内容 */}
      <main className="flex-1 pb-24">
        {view === 'list' && <ShopList onSelect={selectShop} />}
        {view === 'shop' && shop && (
          <ShopDetail
            shop={shop}
            items={items}
            onAdd={(id) => setItems((c) => addToCart(c, id))}
            onRemove={(id) => setItems((c) => removeFromCart(c, id))}
          />
        )}
        {view === 'cart' && shop && (
          <CartView
            shop={shop}
            items={items}
            onAdd={(id) => setItems((c) => addToCart(c, id))}
            onRemove={(id) => setItems((c) => removeFromCart(c, id))}
          />
        )}
        {view === 'checkout' && shop && (
          <CheckoutView shop={shop} items={items} address={address} onAddressChange={setAddress} />
        )}
        {view === 'tracking' && shop && order && (
          <TrackingView shop={shop} orderNo={order.no} startMs={order.startMs} address={address} />
        )}
      </main>

      {/* 底部操作栏 */}
      {(view === 'shop' || view === 'cart') && shop && count > 0 && (
        <BottomBar
          left={
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingCart size={26} className="text-white" />
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                  {count}
                </span>
              </div>
              <span className="text-lg font-bold text-white">¥{total(shop, items)}</span>
            </div>
          }
          action={
            canCheckout
              ? { label: view === 'shop' ? '查看购物车' : '去结算', onClick: () => setView(view === 'shop' ? 'cart' : 'checkout') }
              : { label: `还差 ¥${amountToMinOrder(shop, items)} 起送`, disabled: true }
          }
        />
      )}

      {view === 'checkout' && shop && (
        <BottomBar
          left={<span className="text-lg font-bold text-white">¥{total(shop, items)}</span>}
          action={{ label: '提交订单', onClick: placeOrder }}
        />
      )}

      {view === 'tracking' && (
        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md p-3">
          <button
            onClick={backToList}
            className="w-full rounded-full bg-orange-500 py-3 text-center font-bold text-white shadow-lg active:scale-[0.99]"
          >
            再画一单饼
          </button>
        </div>
      )}
    </div>
  )
}

function BottomBar({
  left,
  action,
}: {
  left: React.ReactNode
  action: { label: string; onClick?: () => void; disabled?: boolean }
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md p-3">
      <div className="flex items-center justify-between rounded-full bg-gray-800 py-2 pl-5 pr-2 shadow-lg">
        {left}
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className={`rounded-full px-6 py-2 text-sm font-bold transition active:scale-95 ${
            action.disabled ? 'bg-gray-600 text-gray-300' : 'bg-orange-500 text-white'
          }`}
        >
          {action.label}
        </button>
      </div>
    </div>
  )
}
