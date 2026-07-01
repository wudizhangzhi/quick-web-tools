/**
 * Scrape Hermès China category pages into lib/virtual-hermes/catalog.json.
 *
 *   npm run fetch:hermes              # discover all nav categories + scrape
 *   npm run fetch:hermes -- --seeds   # manual seed list only
 *   npm run fetch:hermes -- --details # also fetch PDP descriptions/images
 *   npm run fetch:hermes -- --limit 5 # cap categories (dev)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const OUT = join(process.cwd(), 'lib', 'virtual-hermes', 'catalog.json')
const BASE = 'https://www.hermes.cn'

/** Curated high-traffic categories (paths verified on hermes.cn). */
const CATEGORY_SEEDS: { id: string; label: string; path: string }[] = [
  { id: 'men-fw', label: '男士成衣·秋冬系列', path: '/cn/zh/category/男士/成衣系列/秋冬系列/' },
  { id: 'men-shoes', label: '男士鞋履', path: '/cn/zh/category/男士/鞋履/所有系列/' },
  { id: 'men-ties', label: '男士领带', path: '/cn/zh/category/男士/领带围巾/领带领结口袋巾/' },
  { id: 'men-belts', label: '男士腰带', path: '/cn/zh/category/男士/腰带/' },
  { id: 'men-bags', label: '男士包袋', path: '/cn/zh/category/皮具/箱包晚宴包/男士箱包晚宴包/' },
  { id: 'men-jewelry', label: '男士时尚首饰', path: '/cn/zh/category/男士/配饰/时尚饰品/' },
  { id: 'women-fw', label: '女士成衣·秋冬系列', path: '/cn/zh/category/女士/成衣系列/秋冬系列/' },
  { id: 'women-shoes', label: '女士鞋履', path: '/cn/zh/category/女士/鞋履/所有系列/' },
  { id: 'women-bags', label: '女士包袋', path: '/cn/zh/category/皮具/箱包晚宴包/女士箱包晚宴包/' },
  { id: 'women-silk', label: '女士丝巾', path: '/cn/zh/category/women/scarves-shawls-and-stoles/view-all/' },
  { id: 'leather-small', label: '小皮具', path: '/cn/zh/category/皮具/小皮具/' },
  { id: 'jewelry-silver', label: '银饰', path: '/cn/zh/category/珠宝/银饰/' },
  { id: 'jewelry-gold', label: '金饰', path: '/cn/zh/category/珠宝/金饰/' },
  { id: 'watches', label: '腕表', path: '/cn/zh/category/制表工艺/男士/' },
  { id: 'fragrance-women', label: '女士香水', path: '/cn/zh/category/香水/女士系列/' },
  { id: 'fragrance-men', label: '男士香水', path: '/cn/zh/category/香水/男士系列/' },
  { id: 'home', label: '家居', path: '/cn/zh/category/生活艺术/家具照明/' },
  { id: 'equestrian', label: '马术', path: '/cn/zh/category/马术系列/骑师用品/' },
  { id: 'gifts-women', label: '女士礼品', path: '/cn/zh/category/礼品/女士礼品/' },
  { id: 'gifts-men', label: '男士礼品', path: '/cn/zh/category/礼品/男士礼品/' },
  { id: 'beauty', label: '美妆', path: '/cn/zh/category/美妆/面部/' },
]

import type { Catalog, CatalogCategory, CatalogProduct } from '../lib/virtual-hermes/types'

export type { Catalog, CatalogCategory, CatalogProduct }

const UA = 'quick-web-tools/hermes-scraper'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function decodeHtml(s: string) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function skuFromPath(path: string): string {
  const m = path.match(/-([A-Z]\d[\w]+)\/?$/i)
  return m ? m[1] : path.split('/').filter(Boolean).pop() ?? path
}

function normalizeImage(url: string): string {
  if (url.startsWith('//')) return `https:${url}`
  return url
}

function cleanCategoryPath(raw: string): string {
  let path = raw.split('#')[0].split('?')[0]
  path = path.replace(/&amp;/g, '&')
  if (!path.endsWith('/')) path += '/'
  return path
}

function idFromPath(path: string): string {
  const parts = decodeURIComponent(path)
    .replace(/^\/cn\/zh\/category\//, '')
    .split('/')
    .filter(Boolean)
  return parts.join('-').replace(/[^a-zA-Z0-9\u4e00-\u9fff-]/g, '-').slice(0, 80) || 'misc'
}

function labelFromHtml(html: string, fallback: string): string {
  const h1 = html.match(/<h1[^>]*>([^<]+)</i)?.[1]?.trim()
  if (h1) return decodeHtml(h1)
  const title = html.match(/<title>([^<|]+)/i)?.[1]?.trim()
  if (title) return decodeHtml(title.split('|')[0].trim())
  return fallback
}

/** Parse products from category page HTML. */
function parseCategoryHtml(html: string, categoryId: string, categoryLabel: string): CatalogProduct[] {
  const products: CatalogProduct[] = []
  const seen = new Set<string>()

  const linkRe =
    /\[([^\]]+)\]\((\/cn\/zh\/product\/[^)]+)\s*"([^"]*)"\)[^,]*,?\s*(?:颜色:\s*([^,\n]+))?\s*,?\s*价格\s*¥\s*([\d,]+)/g

  let m: RegExpExecArray | null
  while ((m = linkRe.exec(html)) !== null) {
    const [, name, path, title, color, priceStr] = m
    const sku = skuFromPath(path)
    if (seen.has(sku)) continue
    seen.add(sku)
    const price = parseInt(priceStr.replace(/,/g, ''), 10)
    const colorFromTitle = title.match(/,\s*([^,]+)$/)?.[1]?.trim()
    products.push({
      id: sku,
      sku,
      slug: path.split('/').filter(Boolean).pop()?.replace(/\/$/, '') ?? sku,
      name: decodeHtml(name.trim()),
      price,
      color: color?.trim() || colorFromTitle,
      image: '',
      categoryId,
      categoryLabel,
      path,
      comingSoon: html.includes('即将上市') && html.indexOf('即将上市', m.index) < m.index + 200,
    })
  }

  const hrefRe = /href="(\/cn\/zh\/product\/[^"]+)"/g
  const imgRe = /\/\/assets\.hermes\.cn\/is\/image\/hermesproduct\/([^?"\s]+)/g
  const imgs = [...html.matchAll(imgRe)].map((x) =>
    normalizeImage(`//assets.hermes.cn/is/image/hermesproduct/${x[1]}`),
  )

  while ((m = hrefRe.exec(html)) !== null) {
    const path = m[1]
    const sku = skuFromPath(path)
    if (seen.has(sku)) {
      const existing = products.find((p) => p.sku === sku)
      if (existing && !existing.image) {
        const imgIdx = products.indexOf(existing)
        if (imgs[imgIdx]) existing.image = imgs[imgIdx]
      }
      continue
    }
    seen.add(sku)
    const slugPart = path.split('/').filter(Boolean).pop() ?? ''
    const esc = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const nameMatch =
      html.match(new RegExp(`title="([^"]+)"[^>]*href="${esc}"`)) ??
      html.match(new RegExp(`href="${esc}"[^>]*title="([^"]+)"`))
    const title = nameMatch?.[1] ?? slugPart
    const name = title.split(',')[0].trim()
    const color = title.split(',')[1]?.trim()
    products.push({
      id: sku,
      sku,
      slug: slugPart,
      name: decodeHtml(name),
      price: 0,
      color,
      image: imgs[products.length] ?? '',
      categoryId,
      categoryLabel,
      path,
    })
  }

  products.forEach((p, i) => {
    if (!p.image && imgs[i]) p.image = imgs[i]
    if (!p.image) {
      p.image = `https://assets.hermes.cn/is/image/hermesproduct/${p.sku}_worn_1?size=3000,3000&$product_item_grid_g$&wid=800&hei=800`
    }
  })

  return products
}

async function fetchText(url: string): Promise<string> {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (e) {
      if (i === 2) throw e
      await sleep(800 * (i + 1))
    }
  }
  throw new Error('unreachable')
}

async function discoverCategories(): Promise<{ id: string; label: string; path: string }[]> {
  const html = await fetchText(`${BASE}/cn/zh/`)
  const raw = [...html.matchAll(/href="(\/cn\/zh\/category\/[^"]+)"/g)].map((m) => m[1])
  const paths = [...new Set(raw.map(cleanCategoryPath))].filter((p) => !p.includes('fh_location'))
  return paths.map((path) => ({
    id: idFromPath(path),
    label: decodeURIComponent(path.replace(/^\/cn\/zh\/category\//, '').replace(/\/$/, '')),
    path,
  }))
}

async function fetchProductDetail(path: string): Promise<Partial<CatalogProduct>> {
  const html = await fetchText(`${BASE}${path}`)
  const images = [...html.matchAll(/\/\/assets\.hermes\.cn\/is\/image\/hermesproduct\/[^?"\s]+/g)].map((x) =>
    normalizeImage(x[0]),
  )
  const uniqueImages = [...new Set(images)].filter(
    (u) => u.includes('_worn') || u.includes('_front') || u.includes('800-800'),
  )

  const descMatch =
    html.match(/产品描述[\s\S]*?<\/h\d>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i) ??
    html.match(/产品描述\s*([\s\S]{20,800}?)(?=产品编号|产品细节|保养)/)
  const description = descMatch
    ? decodeHtml(descMatch[1].replace(/<[^>]+>/g, '\n').replace(/\s+/g, ' ').trim())
    : undefined

  const refMatch = html.match(/产品编号[：:\s]*([A-Z0-9]+)/i)
  const priceMatch = html.match(/价格\s*¥\s*([\d,]+)/)
  const sizes = [...html.matchAll(/>(\d{2}|XS|S|M|L|XL|XXL|均码)</g)].map((x) => x[1])

  return {
    images: uniqueImages.slice(0, 8),
    description,
    productRef: refMatch?.[1],
    price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : undefined,
    sizes: sizes.length ? [...new Set(sizes)] : ['均码'],
  }
}

async function scrapeCategory(seed: { id: string; label: string; path: string }) {
  const url = `${BASE}${seed.path}`
  const html = await fetchText(url)
  const label = labelFromHtml(html, seed.label)
  const parsed = parseCategoryHtml(html, seed.id, label)
  for (const p of parsed) {
    if (!p.price) {
      const priceRe = new RegExp(`${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^¥]*¥\\s*([\\d,]+)`)
      const pm = html.match(priceRe)
      if (pm) p.price = parseInt(pm[1].replace(/,/g, ''), 10)
    }
  }
  return { parsed, label }
}

async function main() {
  const args = process.argv.slice(2)
  const withDetails = args.includes('--details')
  const seedsOnly = args.includes('--seeds')
  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined

  let seeds = seedsOnly ? CATEGORY_SEEDS : [...CATEGORY_SEEDS]
  if (!seedsOnly) {
    console.log('Discovering categories from homepage...')
    const discovered = await discoverCategories()
    const seenPaths = new Set(seeds.map((s) => s.path))
    for (const d of discovered) {
      if (!seenPaths.has(d.path)) {
        seeds.push(d)
        seenPaths.add(d.path)
      }
    }
    console.log(`  → ${seeds.length} category URLs (${discovered.length} discovered + seeds)`)
  }

  if (limit) seeds = seeds.slice(0, limit)

  const allProducts = new Map<string, CatalogProduct>()
  const categories: CatalogCategory[] = []

  for (const seed of seeds) {
    console.log(`Fetching ${seed.label || seed.id} ...`)
    try {
      const { parsed, label } = await scrapeCategory(seed)
      for (const p of parsed) {
        if (!allProducts.has(p.sku)) allProducts.set(p.sku, p)
      }
      categories.push({ id: seed.id, label, path: seed.path, productCount: parsed.length })
      console.log(`  → ${parsed.length} products`)
    } catch (e) {
      console.warn(`  ✗ failed: ${e}`)
      categories.push({ id: seed.id, label: seed.label, path: seed.path, productCount: 0 })
    }
    await sleep(350)
  }

  let products = [...allProducts.values()]

  if (withDetails) {
    console.log(`Fetching details for ${products.length} products...`)
    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      try {
        const detail = await fetchProductDetail(p.path)
        products[i] = { ...p, ...detail, image: detail.images?.[0] ?? p.image }
        if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${products.length}`)
      } catch {
        /* skip */
      }
      await sleep(250)
    }
  }

  const catalog: Catalog = {
    fetchedAt: new Date().toISOString(),
    categories: categories.filter((c) => c.productCount > 0),
    products,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n')
  console.log(`\nWrote ${products.length} products, ${catalog.categories.length} categories → ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})