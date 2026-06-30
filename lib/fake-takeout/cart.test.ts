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
  packagingFee,
  parseManjian,
  bestManjianDiscount,
  feeBreakdown,
  total,
} from './cart'

const shop: Shop = {
  id: 's1',
  name: '测试店',
  logo: '🍜',
  rating: 4.8,
  monthlySales: 999,
  perCapita: 25,
  deliveryMinutes: 30,
  deliveryFee: 5,
  minOrder: 20,
  distanceKm: 1.2,
  notice: '',
  badges: [],
  promotions: [
    { type: 'manjian', text: '满30减8' },
    { type: 'manjian', text: '满50减15' },
    { type: 'discount', text: '限时8折' },
  ],
  categories: [{ id: 'c1', name: '招牌' }],
  reviews: [],
  reviewTags: [],
  scores: { taste: 4.8, packaging: 4.7, delivery: 2.1 },
  channel: '美食',
  dishes: [
    { id: 'a', categoryId: 'c1', name: 'A', desc: '', price: 12, monthlySales: 1, goodRate: 99, emoji: '🍲' },
    { id: 'b', categoryId: 'c1', name: 'B', desc: '', price: 8, monthlySales: 1, goodRate: 99, emoji: '🥟' },
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
})

describe('packaging fee', () => {
  it('is 1 yuan per portion', () => {
    expect(packagingFee([{ dishId: 'a', qty: 2 }, { dishId: 'b', qty: 1 }])).toBe(3)
  })

  it('is 0 for empty cart', () => {
    expect(packagingFee([])).toBe(0)
  })
})

describe('parseManjian', () => {
  it('parses 满X减Y', () => {
    expect(parseManjian('满30减8')).toEqual({ threshold: 30, minus: 8 })
    expect(parseManjian('满 50 减 15')).toEqual({ threshold: 50, minus: 15 })
  })

  it('returns null for non-manjian text', () => {
    expect(parseManjian('限时8折')).toBeNull()
  })
})

describe('bestManjianDiscount', () => {
  it('picks the largest applicable 满减', () => {
    // subtotal 32 -> only 满30减8 applies
    expect(bestManjianDiscount(shop, [{ dishId: 'a', qty: 2 }, { dishId: 'b', qty: 1 }])).toBe(8)
  })

  it('applies the higher tier once threshold is met', () => {
    // subtotal 60 (a x5 = 60) -> 满50减15 applies
    expect(bestManjianDiscount(shop, [{ dishId: 'a', qty: 5 }])).toBe(15)
  })

  it('is 0 when below all thresholds', () => {
    // subtotal 8 -> none
    expect(bestManjianDiscount(shop, [{ dishId: 'b', qty: 1 }])).toBe(0)
  })
})

describe('feeBreakdown / total', () => {
  const items = [
    { dishId: 'a', qty: 2 }, // 24
    { dishId: 'b', qty: 1 }, // 8  => subtotal 32, 3 portions
  ]

  it('breaks fees down: subtotal + delivery + packaging - discount', () => {
    expect(feeBreakdown(shop, items)).toEqual({
      subtotal: 32,
      deliveryFee: 5,
      packagingFee: 3,
      discount: 8, // 满30减8
      payable: 32 + 5 + 3 - 8, // 32
    })
  })

  it('total equals payable', () => {
    expect(total(shop, items)).toBe(32)
  })

  it('all zero for an empty cart (no phantom fees)', () => {
    expect(feeBreakdown(shop, [])).toEqual({
      subtotal: 0,
      deliveryFee: 0,
      packagingFee: 0,
      discount: 0,
      payable: 0,
    })
    expect(total(shop, [])).toBe(0)
  })

  it('never goes negative', () => {
    const cheap: Shop = { ...shop, promotions: [{ type: 'manjian', text: '满5减100' }] }
    expect(total(cheap, [{ dishId: 'b', qty: 1 }])).toBe(0)
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
