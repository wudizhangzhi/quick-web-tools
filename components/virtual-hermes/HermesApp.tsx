'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Manrope } from 'next/font/google'
import { event as gaEvent } from '@/lib/gtag'
import { HOMEPAGE_SECTIONS } from '@/lib/virtual-hermes/data'
import { getProduct, getCategory, productsByCategory, featuredProducts } from '@/lib/virtual-hermes/catalog'
import {
  addToCart,
  removeFromCart,
  removeLine,
  expandCart,
  cartCount,
  cartTotal,
  type CartLine,
} from '@/lib/virtual-hermes/cart'
import type { Address, Order } from '@/lib/virtual-hermes/order'
import { formatOrderNo } from '@/lib/virtual-hermes/order'
import Header from './Header'
import MobileMenu from './MobileMenu'
import Footer from './Footer'
import HeroSection from './HeroSection'
import CategoryRow from './CategoryRow'
import EditorialSection from './EditorialSection'
import ProductGrid from './ProductGrid'
import CartSheet from './CartSheet'
import CookieBanner from './CookieBanner'
import CategoryView from './CategoryView'
import ProductDetailView from './ProductDetailView'
import SearchView from './SearchView'
import CheckoutView from './CheckoutView'
import OrderTrackingView from './OrderTrackingView'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['300', '400', '500', '600'],
})

type View = 'home' | 'category' | 'product' | 'search' | 'checkout' | 'tracking'

const COOKIE_KEY = 'virtual-hermes-cookies'
const CART_KEY = 'virtual-hermes-cart-v2'
const ADDRESS_KEY = 'virtual-hermes-address'
const ORDERS_KEY = 'virtual-hermes-orders'

const EMPTY_ADDRESS: Address = { name: '', phone: '', detail: '' }

export default function HermesApp() {
  const [view, setView] = useState<View>('home')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [productId, setProductId] = useState<string | null>(null)
  const [activeOrderNo, setActiveOrderNo] = useState<string | null>(null)

  const [cookiesAccepted, setCookiesAccepted] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartLines, setCartLines] = useState<CartLine[]>([])
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS)
  const [orders, setOrders] = useState<Order[]>([])
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) setCookiesAccepted(false)
      const rawCart = localStorage.getItem(CART_KEY)
      if (rawCart) setCartLines(JSON.parse(rawCart))
      const rawAddr = localStorage.getItem(ADDRESS_KEY)
      if (rawAddr) setAddress({ ...EMPTY_ADDRESS, ...JSON.parse(rawAddr) })
      const rawOrders = localStorage.getItem(ORDERS_KEY)
      if (rawOrders) setOrders(JSON.parse(rawOrders))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartLines))
    } catch {
      /* ignore */
    }
  }, [cartLines])

  useEffect(() => {
    try {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(address))
    } catch {
      /* ignore */
    }
  }, [address])

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
    } catch {
      /* ignore */
    }
  }, [orders])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view, categoryId, productId, activeOrderNo])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const goHome = useCallback(() => {
    setView('home')
    setCategoryId(null)
    setProductId(null)
    setActiveOrderNo(null)
  }, [])

  const goCategory = useCallback((id: string) => {
    setCategoryId(id)
    setProductId(null)
    setActiveOrderNo(null)
    setView('category')
  }, [])

  const goProduct = useCallback((id: string) => {
    setProductId(id)
    setView('product')
  }, [])

  const goSearch = useCallback(() => {
    setView('search')
    setProductId(null)
    setActiveOrderNo(null)
  }, [])

  const onFakeNav = useCallback(
    (label: string) => {
      showToast(`「${label}」暂时缺货，配货员还在路上 👜`)
    },
    [showToast],
  )

  const handleAddToCart = useCallback(
    (pid: string, size: string) => {
      const p = getProduct(pid)
      if (!p) return
      setCartLines((prev) => addToCart(prev, pid, size))
      showToast(`已加入购物袋：${p.name}`)
    },
    [showToast],
  )

  const expandedCart = useMemo(() => expandCart(cartLines, getProduct), [cartLines])
  const total = useMemo(() => cartTotal(cartLines, getProduct), [cartLines])
  const count = cartCount(cartLines)

  const activeProduct = productId ? getProduct(productId) : undefined
  const activeCategory = categoryId ? getCategory(categoryId) : undefined
  const categoryProducts = categoryId ? productsByCategory(categoryId) : []
  const activeOrder = activeOrderNo ? orders.find((o) => o.no === activeOrderNo) : undefined

  const onCheckout = useCallback(() => {
    if (expandedCart.length === 0) return
    setCartOpen(false)
    setView('checkout')
  }, [expandedCart.length])

  const placeOrder = useCallback(() => {
    if (expandedCart.length === 0) return
    const no = formatOrderNo(Date.now())
    const order: Order = {
      no,
      startMs: Date.now(),
      items: cartLines,
      address,
      payable: total,
      status: 'allocating',
    }
    setOrders((prev) => [order, ...prev])
    setCartLines([])
    setActiveOrderNo(no)
    setView('tracking')
    gaEvent('virtual_hermes_checkout', { status: 'success' })
    showToast('订单已提交，配货员永远在路上 🐎')
  }, [expandedCart.length, cartLines, address, total, showToast])

  const featuredA = featuredProducts('men-fw', 4)
  const featuredB = featuredProducts('men-shoes', 4)

  return (
    <div className={`${manrope.variable} min-h-screen bg-hermes-cream font-hermes text-black antialiased`}>
      <a href="#main" className="sr-only focus:not-sr-only">
        前往主要内容
      </a>

      <Header
        cartCount={count}
        onMenuOpen={() => setMenuOpen(true)}
        onCartOpen={() => setCartOpen(true)}
        onHome={goHome}
        onCategory={goCategory}
        onSearch={goSearch}
        onFakeNav={onFakeNav}
      />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onCategory={goCategory}
        onSearch={goSearch}
        onFakeNav={onFakeNav}
      />

      <main id="main">
        {view === 'home' &&
          (() => {
            let productBlock = 0
            return HOMEPAGE_SECTIONS.map((section, i) => {
            switch (section.type) {
              case 'hero':
                return (
                  <HeroSection
                    key={i}
                    title={section.title}
                    description={section.description}
                    cta={section.cta}
                    poster={section.poster}
                    onCta={() => goCategory('men-fw')}
                  />
                )
              case 'categories':
                return <CategoryRow key={i} items={section.items} onSelect={goCategory} />
              case 'editorial':
                return (
                  <EditorialSection
                    key={i}
                    block={section.block}
                    onCta={() => {
                      const href = section.block.ctaHref
                      if (href.includes('men-shoes')) goCategory('men-shoes')
                      else goCategory('men-fw')
                    }}
                  />
                )
              case 'products': {
                const block = productBlock++
                return (
                  <ProductGrid
                    key={i}
                    products={block === 0 ? featuredA : featuredB}
                    onProduct={goProduct}
                  />
                )
              }
              default:
                return null
            }
          })
          })()}

        {view === 'category' && activeCategory && (
          <CategoryView
            category={activeCategory}
            products={categoryProducts}
            onBack={goHome}
            onProduct={goProduct}
          />
        )}

        {view === 'product' && activeProduct && (
          <ProductDetailView
            product={activeProduct}
            onBack={() => {
              const cat = activeProduct.categoryId
              if (cat && getCategory(cat)) goCategory(cat)
              else goHome()
            }}
            onAdd={handleAddToCart}
          />
        )}

        {view === 'search' && <SearchView onBack={goHome} onProduct={goProduct} />}

        {view === 'checkout' && (
          <CheckoutView
            lines={expandedCart}
            total={total}
            address={address}
            onAddressChange={setAddress}
            onBack={() => {
              setCartOpen(true)
              setView('home')
            }}
            onSubmit={placeOrder}
          />
        )}

        {view === 'tracking' && activeOrder && (
          <OrderTrackingView
            orderNo={activeOrder.no}
            startMs={activeOrder.startMs}
            lines={expandCart(activeOrder.items, getProduct)}
            payable={activeOrder.payable}
            address={activeOrder.address}
            onBack={goHome}
          />
        )}
      </main>

      {view === 'home' && <Footer onFake={onFakeNav} />}

      <CartSheet
        open={cartOpen}
        lines={expandedCart}
        total={total}
        onClose={() => setCartOpen(false)}
        onDecQty={(pid, size) => setCartLines((prev) => removeFromCart(prev, pid, size))}
        onRemoveLine={(pid, size) => setCartLines((prev) => removeLine(prev, pid, size))}
        onAddQty={(pid, size) => {
          setCartLines((prev) => addToCart(prev, pid, size))
        }}
        onProduct={(pid) => {
          setCartOpen(false)
          goProduct(pid)
        }}
        onCheckout={onCheckout}
      />

      {!cookiesAccepted && (
        <CookieBanner
          onAccept={() => {
            localStorage.setItem(COOKIE_KEY, '1')
            setCookiesAccepted(true)
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[80] max-w-sm -translate-x-1/2 rounded-sm bg-black/85 px-4 py-3 text-center text-xs text-white">
          {toast}
        </div>
      )}
    </div>
  )
}