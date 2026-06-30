'use client'

import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { event as gaEvent } from '@/lib/gtag'
import type { Shop } from '@/lib/fake-takeout/types'
import { findShop } from '@/lib/fake-takeout/data'
import { addToCart, removeFromCart, total, type CartItem } from '@/lib/fake-takeout/cart'
import { formatOrderNo, type Address, type Order } from '@/lib/fake-takeout/order'
import HomeView from './HomeView'
import ShopView from './ShopView'
import CheckoutView from './CheckoutView'
import TrackingView from './TrackingView'
import SearchView from './SearchView'
import LocationView from './LocationView'
import MemberView from './MemberView'
import OrdersView from './OrdersView'
import ProfileView from './ProfileView'
import BottomNav, { type MainTab } from './BottomNav'

type View = MainTab | 'shop' | 'checkout' | 'tracking' | 'search' | 'location'

const STORAGE_KEY = 'fake-takeout-v2'
const ORDERS_KEY = 'fake-takeout-orders-v1'
const EMPTY_ADDRESS: Address = { name: '', phone: '', detail: '' }
const DEFAULT_LOCATION = '异次元大厦·收不到货的地方'
const MAIN_TABS: MainTab[] = ['home', 'member', 'orders', 'profile']

interface Persisted {
  shopId: string | null
  items: CartItem[]
  address: Address
  remark: string
  location: string
}

export default function TakeoutApp() {
  const [view, setView] = useState<View>('home')
  const [shopId, setShopId] = useState<string | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS)
  const [remark, setRemark] = useState('')
  const [location, setLocation] = useState(DEFAULT_LOCATION)
  const [orders, setOrders] = useState<Order[]>([])
  const [activeOrderNo, setActiveOrderNo] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // 水合
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const d = JSON.parse(raw) as Persisted
        if (d.shopId) setShopId(d.shopId)
        if (Array.isArray(d.items)) setItems(d.items)
        if (d.address) setAddress({ ...EMPTY_ADDRESS, ...d.address })
        if (typeof d.remark === 'string') setRemark(d.remark)
        if (typeof d.location === 'string') setLocation(d.location)
      }
      const rawOrders = localStorage.getItem(ORDERS_KEY)
      if (rawOrders) {
        const o = JSON.parse(rawOrders)
        if (Array.isArray(o)) setOrders(o)
      }
    } catch {
      /* 忽略坏数据 */
    }
  }, [])

  // 持久化购物车/地址
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ shopId, items, address, remark, location } satisfies Persisted)
      )
    } catch {
      /* 忽略 */
    }
  }, [shopId, items, address, remark, location])

  // 持久化订单
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
    } catch {
      /* 忽略 */
    }
  }, [orders])

  const shop: Shop | undefined = shopId ? findShop(shopId) : undefined
  const activeOrder = activeOrderNo ? orders.find((o) => o.no === activeOrderNo) ?? null : null

  function selectShop(next: Shop) {
    if (next.id !== shopId) {
      setShopId(next.id)
      setItems([])
    }
    setView('shop')
  }

  function placeOrder() {
    if (!shop) return
    const startMs = Date.now()
    const order: Order = {
      no: formatOrderNo(startMs),
      startMs,
      shopId: shop.id,
      shopName: shop.name,
      shopLogo: shop.logo,
      items,
      address,
      remark,
      payable: total(shop, items),
    }
    setOrders((prev) => [order, ...prev])
    setActiveOrderNo(order.no)
    setItems([])
    setView('tracking')
    gaEvent('fake_takeout_order', { status: 'placed' })
    confetti({ particleCount: 60, spread: 70, startVelocity: 34, origin: { y: 0.6 }, scalar: 0.9 })
  }

  function openOrder(no: string) {
    setActiveOrderNo(no)
    setView('tracking')
  }

  function showToast(label: string) {
    setToast(`「${label}」还没做，这是个画饼网站 🫓`)
    setTimeout(() => setToast(null), 2000)
  }

  const isMain = (MAIN_TABS as string[]).includes(view)

  return (
    <div className="relative mx-auto flex h-[100dvh] max-w-[440px] flex-col overflow-hidden bg-white shadow-xl">
      <div className="min-h-0 flex-1">
        {view === 'home' && (
          <div className="h-full overflow-y-auto">
            <HomeView
              location={location}
              onSelectShop={selectShop}
              onOpenSearch={() => setView('search')}
              onOpenLocation={() => setView('location')}
            />
          </div>
        )}

        {view === 'member' && (
          <div className="h-full overflow-y-auto">
            <MemberView onActivate={() => showToast('开通会员')} />
          </div>
        )}

        {view === 'orders' && (
          <OrdersView orders={orders} onOpenOrder={openOrder} onGoHome={() => setView('home')} />
        )}

        {view === 'profile' && (
          <div className="h-full overflow-y-auto">
            <ProfileView
              orderCount={orders.length}
              onOpenOrders={() => setView('orders')}
              onOpenMember={() => setView('member')}
              onFake={showToast}
            />
          </div>
        )}

        {view === 'search' && (
          <SearchView onBack={() => setView('home')} onSelectShop={selectShop} />
        )}

        {view === 'location' && (
          <LocationView
            current={location}
            onBack={() => setView('home')}
            onSelect={(loc) => {
              setLocation(loc)
              setView('home')
            }}
          />
        )}

        {view === 'shop' && shop && (
          <ShopView
            shop={shop}
            items={items}
            onAdd={(id) => setItems((c) => addToCart(c, id))}
            onRemove={(id) => setItems((c) => removeFromCart(c, id))}
            onBack={() => setView('home')}
            onCheckout={() => setView('checkout')}
            onClear={() => setItems([])}
          />
        )}

        {view === 'checkout' && shop && (
          <div className="relative h-full">
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

        {view === 'tracking' && activeOrder && (
          <div className="relative h-full">
            <TrackingView
              shop={findShop(activeOrder.shopId) ?? shop!}
              items={activeOrder.items}
              orderNo={activeOrder.no}
              startMs={activeOrder.startMs}
              address={activeOrder.address}
              onBack={() => setView('orders')}
              onHome={() => setView('home')}
            />
          </div>
        )}
      </div>

      {isMain && (
        <BottomNav active={view as MainTab} onNavigate={(t) => setView(t)} orderCount={orders.length} />
      )}

      {toast && (
        <div className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/80 px-4 py-2.5 text-center text-sm text-white">
          {toast}
        </div>
      )}
    </div>
  )
}
