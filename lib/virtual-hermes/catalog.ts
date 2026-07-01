import type { Catalog, CatalogProduct, CatalogCategory } from './types'
import catalogData from './catalog.json'

export type { CatalogProduct, CatalogCategory }

const catalog = catalogData as unknown as Catalog

export const CATEGORIES = catalog.categories
export const PRODUCTS = catalog.products
export const CATALOG_FETCHED_AT = catalog.fetchedAt

const byId = new Map(PRODUCTS.map((p) => [p.id, p]))
const bySku = new Map(PRODUCTS.map((p) => [p.sku, p]))

export function getProduct(id: string): CatalogProduct | undefined {
  return byId.get(id) ?? bySku.get(id)
}

export function getCategory(id: string): CatalogCategory | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

export function featuredProducts(categoryId: string, limit = 4): CatalogProduct[] {
  return productsByCategory(categoryId).slice(0, limit)
}

export function productsByCategory(categoryId: string): CatalogProduct[] {
  return PRODUCTS.filter((p) => p.categoryId === categoryId)
}

export function searchProducts(query: string): CatalogProduct[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.color?.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q),
  )
}

export function relatedProducts(product: CatalogProduct, limit = 4): CatalogProduct[] {
  return PRODUCTS.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, limit)
}

export { formatPrice } from './data'