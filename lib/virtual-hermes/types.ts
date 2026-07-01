export interface NavItem {
  label: string
  href: string
  categoryId?: string
  children?: { label: string; href: string; categoryId?: string }[]
}

export interface CategoryLink {
  label: string
  href: string
  categoryId?: string
  image: string
}

/** @deprecated use CatalogProduct */
export interface Product {
  id: string
  name: string
  price: number
  image: string
  href: string
  color?: string
}

export interface CatalogProduct {
  id: string
  sku: string
  slug: string
  name: string
  price: number
  color?: string
  image: string
  images?: string[]
  categoryId: string
  categoryLabel: string
  path: string
  comingSoon?: boolean
  description?: string
  sizes?: string[]
  productRef?: string
}

export interface CatalogCategory {
  id: string
  label: string
  path: string
  productCount: number
}

export interface Catalog {
  fetchedAt: string
  categories: CatalogCategory[]
  products: CatalogProduct[]
}

export interface EditorialBlock {
  title: string
  description: string
  cta: string
  ctaHref: string
  image?: string
  dark?: boolean
}

export interface ProductRow {
  products: Product[]
}

export type HomepageSection =
  | { type: 'hero'; title: string; description: string; cta: string; ctaHref: string; poster: string }
  | { type: 'categories'; items: CategoryLink[] }
  | { type: 'editorial'; block: EditorialBlock }
  | { type: 'products'; row: ProductRow }