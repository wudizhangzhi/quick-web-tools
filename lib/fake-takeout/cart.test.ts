import { describe, it, expect } from 'vitest'
import type { Shop } from './types'
import {
  addToCart,
  removeFromCart,
  qtyOf,
  cartCount,
  cartLines,
  subtotal,
  meetsMinOrder,
  amountToMinOrder,
  total,
} from './cart'

const shop: Shop = {
  id: 's1',
  name: '测试店',
  emoji: '🍜',
  notice: '',
  rating: 4.8,
  monthlySales: 999,
  deliveryMinutes: 30,
  deliveryFee: 5,
  minOrder: 20,
  distanceKm: 1.2,
  reviews: [],
  dishes: [
    { id: 'a', name: 'A', desc: '', price: 12, monthlySales: 1, rating: 5, emoji: '🍲' },
    { id: 'b', name: 'B', desc: '', price: 8, monthlySales: 1, rating: 5, emoji: '🥟' },
  ],
}

describe('addToCart / removeFromCart', () => {
  it('adds a new dish with qty 1', () => {
    expect(addToCart([], 'a')).toEqual([{ dishId: 'a', qty: 1 }])
  })

  it('increments an existing dish', () => {
    const items = addToCart(addToCart([], 'a'), 'a')
    expect(qtyOf(items, 'a')).toBe(2)
  })

  it('does not mutate the input array', () => {
    const items = [{ dishId: 'a', qty: 1 }]
    addToCart(items, 'a')
    expect(items).toEqual([{ dishId: 'a', qty: 1 }])
  })

  it('decrements and removes when reaching zero', () => {
    const items = [{ dishId: 'a', qty: 1 }]
    expect(removeFromCart(items, 'a')).toEqual([])
  })
})

describe('totals', () => {
  const items = [
    { dishId: 'a', qty: 2 }, // 24
    { dishId: 'b', qty: 1 }, // 8
  ]

  it('counts total portions', () => {
    expect(cartCount(items)).toBe(3)
  })

  it('builds renderable lines with subtotals', () => {
    const lines = cartLines(shop, items)
    expect(lines.map((l) => l.subtotal)).toEqual([24, 8])
  })

  it('drops items whose dish no longer exists', () => {
    expect(cartLines(shop, [{ dishId: 'ghost', qty: 3 }])).toEqual([])
  })

  it('sums subtotal without delivery fee', () => {
    expect(subtotal(shop, items)).toBe(32)
  })

  it('adds delivery fee to grand total', () => {
    expect(total(shop, items)).toBe(37)
  })

  it('grand total is 0 for an empty cart (no phantom delivery fee)', () => {
    expect(total(shop, [])).toBe(0)
  })
})

describe('minimum order', () => {
  it('detects when below minimum', () => {
    const items = [{ dishId: 'b', qty: 1 }] // 8 < 20
    expect(meetsMinOrder(shop, items)).toBe(false)
    expect(amountToMinOrder(shop, items)).toBe(12)
  })

  it('detects when at/above minimum', () => {
    const items = [{ dishId: 'a', qty: 2 }] // 24 >= 20
    expect(meetsMinOrder(shop, items)).toBe(true)
    expect(amountToMinOrder(shop, items)).toBe(0)
  })
})
