import type { Shop, Dish, Promotion } from './types'

/** 每份餐盒费，单位元（美团确认订单页常见的「餐盒费」）。 */
export const PACKAGING_FEE_PER_ITEM = 1

/** 购物车里一个菜品的数量记录 */
export interface CartItem {
  dishId: string
  qty: number
}

/** 渲染用：菜品 + 数量 + 小计 */
export interface CartLine {
  dish: Dish
  qty: number
  subtotal: number
}

/** 加一份。已存在则数量 +1，否则追加。返回新数组（不可变）。 */
export function addToCart(items: CartItem[], dishId: string): CartItem[] {
  const existing = items.find((it) => it.dishId === dishId)
  if (existing) {
    return items.map((it) =>
      it.dishId === dishId ? { ...it, qty: it.qty + 1 } : it
    )
  }
  return [...items, { dishId, qty: 1 }]
}

/** 减一份。数量降到 0 时移除该项。返回新数组。 */
export function removeFromCart(items: CartItem[], dishId: string): CartItem[] {
  return items
    .map((it) => (it.dishId === dishId ? { ...it, qty: it.qty - 1 } : it))
    .filter((it) => it.qty > 0)
}

/** 某菜品当前数量。 */
export function qtyOf(items: CartItem[], dishId: string): number {
  return items.find((it) => it.dishId === dishId)?.qty ?? 0
}

/** 购物车总份数。 */
export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, it) => sum + it.qty, 0)
}

/** 把购物车条目映射成可渲染的行（按店铺菜单解析菜品），过滤掉不存在的菜品。 */
export function cartLines(shop: Shop, items: CartItem[]): CartLine[] {
  const lines: CartLine[] = []
  for (const it of items) {
    const dish = shop.dishes.find((d) => d.id === it.dishId)
    if (!dish) continue
    lines.push({ dish, qty: it.qty, subtotal: dish.price * it.qty })
  }
  return lines
}

/** 菜品小计（不含配送费）。 */
export function subtotal(shop: Shop, items: CartItem[]): number {
  return cartLines(shop, items).reduce((sum, line) => sum + line.subtotal, 0)
}

/** 是否达到起送价。 */
export function meetsMinOrder(shop: Shop, items: CartItem[]): boolean {
  return subtotal(shop, items) >= shop.minOrder
}

/** 还差多少钱起送，已达到则为 0。 */
export function amountToMinOrder(shop: Shop, items: CartItem[]): number {
  return Math.max(0, shop.minOrder - subtotal(shop, items))
}

/** 餐盒费：每份 PACKAGING_FEE_PER_ITEM 元。 */
export function packagingFee(items: CartItem[]): number {
  return cartCount(items) * PACKAGING_FEE_PER_ITEM
}

/** 解析「满30减5」式文案，解析不出返回 null。 */
export function parseManjian(text: string): { threshold: number; minus: number } | null {
  const m = text.match(/满\s*(\d+(?:\.\d+)?)\s*减\s*(\d+(?:\.\d+)?)/)
  if (!m) return null
  return { threshold: Number(m[1]), minus: Number(m[2]) }
}

/**
 * 按菜品小计能享受的最大满减额（只看 manjian 类促销，取门槛达标里减得最多的一条）。
 * 美团满减按商品小计判定（不含配送费/餐盒费）。
 */
export function bestManjianDiscount(shop: Shop, items: CartItem[]): number {
  const sub = subtotal(shop, items)
  let best = 0
  for (const p of shop.promotions as Promotion[]) {
    if (p.type !== 'manjian') continue
    const parsed = parseManjian(p.text)
    if (parsed && sub >= parsed.threshold) best = Math.max(best, parsed.minus)
  }
  return best
}

export interface FeeBreakdown {
  subtotal: number
  deliveryFee: number
  packagingFee: number
  discount: number
  /** 实付，最低 0 */
  payable: number
}

/** 确认订单页的费用明细。购物车为空时全为 0。 */
export function feeBreakdown(shop: Shop, items: CartItem[]): FeeBreakdown {
  if (cartCount(items) === 0) {
    return { subtotal: 0, deliveryFee: 0, packagingFee: 0, discount: 0, payable: 0 }
  }
  const sub = subtotal(shop, items)
  const delivery = shop.deliveryFee
  const packaging = packagingFee(items)
  const discount = bestManjianDiscount(shop, items)
  const payable = Math.max(0, sub + delivery + packaging - discount)
  return { subtotal: sub, deliveryFee: delivery, packagingFee: packaging, discount, payable }
}

/** 应付总额（含配送费、餐盒费，减满减），购物车为空时为 0。 */
export function total(shop: Shop, items: CartItem[]): number {
  return feeBreakdown(shop, items).payable
}
