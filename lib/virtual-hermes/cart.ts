import type { CatalogProduct } from './catalog'

export interface CartLine {
  productId: string
  qty: number
  size: string
}

export interface CartLineDetail {
  product: CatalogProduct
  qty: number
  size: string
  subtotal: number
}

export function addToCart(lines: CartLine[], productId: string, size: string): CartLine[] {
  const existing = lines.find((l) => l.productId === productId && l.size === size)
  if (existing) {
    return lines.map((l) =>
      l.productId === productId && l.size === size ? { ...l, qty: l.qty + 1 } : l,
    )
  }
  return [...lines, { productId, qty: 1, size }]
}

export function removeFromCart(lines: CartLine[], productId: string, size: string): CartLine[] {
  return lines
    .map((l) =>
      l.productId === productId && l.size === size ? { ...l, qty: l.qty - 1 } : l,
    )
    .filter((l) => l.qty > 0)
}

export function removeLine(lines: CartLine[], productId: string, size: string): CartLine[] {
  return lines.filter((l) => !(l.productId === productId && l.size === size))
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.qty, 0)
}

export function cartTotal(
  lines: CartLine[],
  getProduct: (id: string) => CatalogProduct | undefined,
): number {
  return lines.reduce((s, l) => {
    const p = getProduct(l.productId)
    return s + (p?.price ?? 0) * l.qty
  }, 0)
}

export function expandCart(
  lines: CartLine[],
  getProduct: (id: string) => CatalogProduct | undefined,
): CartLineDetail[] {
  return lines
    .map((l) => {
      const product = getProduct(l.productId)
      if (!product) return null
      return { product, qty: l.qty, size: l.size, subtotal: product.price * l.qty }
    })
    .filter((x): x is CartLineDetail => x !== null)
}