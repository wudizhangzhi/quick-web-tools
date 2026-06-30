import type { Shop, Dish } from './types'

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

/** 应付总额：菜品小计 + 配送费（购物车为空时为 0）。 */
export function total(shop: Shop, items: CartItem[]): number {
  if (cartCount(items) === 0) return 0
  return subtotal(shop, items) + shop.deliveryFee
}
