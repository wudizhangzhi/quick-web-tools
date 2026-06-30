import type { Shop, HomeChannel } from './types'
import shopsData from './shops.json'

/** 全部店铺（构建期由生成脚本写入 shops.json）。 */
export const SHOPS = shopsData as unknown as Shop[]

/** 首页金刚区频道。前 8 个有真实店铺，后 2 个是装饰入口（点了也没有）。 */
export const CHANNELS: HomeChannel[] = [
  { key: '美食', name: '美食', emoji: '🍱' },
  { key: '早餐', name: '早餐', emoji: '🥟' },
  { key: '汉堡披萨', name: '汉堡披萨', emoji: '🍔' },
  { key: '米粉面', name: '米粉面', emoji: '🍜' },
  { key: '甜点饮品', name: '甜点饮品', emoji: '🧋' },
  { key: '烧烤夜宵', name: '烧烤夜宵', emoji: '🍢' },
  { key: '火锅', name: '火锅', emoji: '🌶️' },
  { key: '日韩料理', name: '日韩料理', emoji: '🍣' },
  { key: '跑腿代购', name: '跑腿代购', emoji: '🛵' },
  { key: '买药', name: '买药', emoji: '💊' },
]

export function findShop(id: string): Shop | undefined {
  return SHOPS.find((s) => s.id === id)
}

/** 按频道筛选；key 为空返回全部。 */
export function shopsByChannel(key: string | null): Shop[] {
  if (!key) return SHOPS
  return SHOPS.filter((s) => s.channel === key)
}

export type SortKey = 'recommend' | 'sales' | 'distance' | 'rating'

/** 列表排序（返回新数组）。 */
export function sortShops(shops: Shop[], key: SortKey): Shop[] {
  const arr = [...shops]
  switch (key) {
    case 'sales':
      return arr.sort((a, b) => b.monthlySales - a.monthlySales)
    case 'distance':
      return arr.sort((a, b) => a.distanceKm - b.distanceKm)
    case 'rating':
      return arr.sort((a, b) => b.rating - a.rating)
    default:
      return arr
  }
}

/** 店内菜品按分类分组（保持分类声明顺序，丢弃空分类）。 */
export function dishesByCategory(shop: Shop): { category: Shop['categories'][number]; dishes: Shop['dishes'] }[] {
  return shop.categories
    .map((category) => ({
      category,
      dishes: shop.dishes.filter((d) => d.categoryId === category.id),
    }))
    .filter((g) => g.dishes.length > 0)
}
