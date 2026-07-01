import type { CategoryLink, HomepageSection, NavItem, Product } from './types'

/** 恶搞品牌名（傌 ≈ 马） */
export const BRAND_NAME = '爱傌仕'

const IMG = (path: string, w = 400) =>
  `https://assets.hermes.cn/is/image/${path}?size=3000,3000&extend=0,0,0,0&align=0,0&$product_item_grid_g$&wid=${w}&hei=${w}`

export const TOP_NAV: NavItem[] = [
  {
    label: '女士',
    href: '#women',
    children: [
      { label: '成衣系列', href: '#women-fw', categoryId: 'women-fw' },
      { label: '鞋履', href: '#women-shoes', categoryId: 'women-shoes' },
      { label: '丝巾与披肩', href: '#women-silk', categoryId: 'women-silk' },
      { label: '包袋', href: '#women-bags', categoryId: 'women-bags' },
    ],
  },
  {
    label: '男士',
    href: '#men',
    children: [
      { label: '成衣系列', href: '#men-fw', categoryId: 'men-fw' },
      { label: '鞋履', href: '#men-shoes', categoryId: 'men-shoes' },
      { label: '领带与口袋巾', href: '#men-ties', categoryId: 'men-ties' },
      { label: '腰带', href: '#men-belts', categoryId: 'men-belts' },
    ],
  },
  { label: '皮具', href: '#leather-small', categoryId: 'leather-small' },
  { label: '珠宝', href: '#jewelry-silver', categoryId: 'jewelry-silver' },
  { label: '腕表', href: '#watches', categoryId: 'watches' },
  { label: '香水与美妆', href: '#fragrance-women', categoryId: 'fragrance-women' },
  { label: '家居与生活艺术', href: '#home', categoryId: 'home' },
  { label: '马术系列', href: '#equestrian', categoryId: 'equestrian' },
  { label: '礼品', href: '#gifts-women', categoryId: 'gifts-women' },
]

export const CATEGORY_ROW: CategoryLink[] = [
  { label: '男士成衣', href: '#men-fw', categoryId: 'men-fw', image: IMG('hermesproduct/657805HA60_worn_1') },
  { label: '银饰', href: '#jewelry-silver', categoryId: 'jewelry-silver', image: IMG('hermesproduct/262890ZHC9_front_wm_1') },
  { label: '时尚首饰', href: '#men-jewelry', categoryId: 'men-jewelry', image: IMG('hermesproduct/339446T%2002_wornsquare_1') },
  { label: '领带', href: '#men-ties', categoryId: 'men-ties', image: IMG('hermesproduct/339446T%2002_wornsquare_1') },
  { label: '男士鞋履', href: '#men-shoes', categoryId: 'men-shoes', image: IMG('hermesproduct/262890ZHC9_front_wm_1') },
  {
    label: '腰带',
    href: '#men-belts',
    categoryId: 'men-belts',
    image:
      'https://assets.hermes.cn/is/image/hermesproduct/beltkits-38?$leatherstrap=077971CABP_composite_3&$buckle=010693UY89_composite_3&extend=0,0,0,0&align=0,0&$product_item_grid_g$&wid=400&hei=400',
  },
  { label: '包袋', href: '#men-bags', categoryId: 'men-bags', image: IMG('hermesproduct/262891ZH90_front_wm_1') },
  { label: '香水', href: '#fragrance-men', categoryId: 'fragrance-men', image: IMG('hermesproduct/284280T%2001_flat_wm_3') },
]

const PRODUCTS_A: Product[] = [
  {
    id: 'p1',
    name: '“Sellier”细节T恤',
    price: 6650,
    color: '蓝色',
    image: IMG('hermesproduct/657805HA60_worn_1'),
    href: '#product-sellier-tee',
  },
  {
    id: 'p2',
    name: 'Next运动鞋',
    price: 11450,
    color: '米色/天然色',
    image: IMG('hermesproduct/262890ZHC9_front_wm_1'),
    href: '#product-next-shoe-1',
  },
  {
    id: 'p3',
    name: 'Jockey皮带扣 & 双面皮腰带38毫米',
    price: 8950,
    color: '米色/天然色',
    image:
      'https://assets.hermes.cn/is/image/hermesproduct/beltkits-38?$leatherstrap=077971CABP_composite_3&$buckle=010693UY89_composite_3&extend=0,0,0,0&align=0,0&$product_item_grid_g$&wid=400&hei=400',
    href: '#product-jockey-belt',
  },
  {
    id: 'p4',
    name: 'One Fish领带',
    price: 2400,
    color: '蓝色',
    image: IMG('hermesproduct/339446T%2002_wornsquare_1'),
    href: '#product-one-fish-tie',
  },
]

const PRODUCTS_B: Product[] = [
  {
    id: 'p5',
    name: '“骏马”皮革细节T恤',
    price: 7450,
    color: '灰色',
    image: IMG('hermesproduct/657800HA76_worn_1'),
    href: '#product-horse-tee',
  },
  {
    id: 'p6',
    name: 'Hisseo皮带扣 & 双面皮腰带32毫米',
    price: 8000,
    color: '黑色',
    image:
      'https://assets.hermes.cn/is/image/hermesproduct/beltkits-32?$leatherstrap=073967CAAB_composite_3&$buckle=011772UP82_composite_3&extend=0,0,0,0&align=0,0&$product_item_grid_g$&wid=400&hei=400',
    href: '#product-hisseo-belt',
  },
  {
    id: 'p7',
    name: '“演出进行时！”65流苏方巾',
    price: 4400,
    color: '蓝色/红色',
    image: IMG('hermesproduct/284280T%2001_flat_wm_3'),
    href: '#product-scarf',
  },
  {
    id: 'p8',
    name: 'Next运动鞋',
    price: 11450,
    color: '白色',
    image: IMG('hermesproduct/262891ZH90_front_wm_1'),
    href: '#product-next-shoe-2',
  },
]

export const HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    type: 'hero',
    title: '顺应潮流，超越时代',
    description: '轻松随性，尽显非凡。男装作品融合现代风尚和隽永美学。',
    cta: '探索经典',
    ctaHref: '#men-ready',
    poster: IMG('hermesproduct/657800HA76_worn_1', 1920),
  },
  { type: 'categories', items: CATEGORY_ROW },
  {
    type: 'editorial',
    block: {
      title: '灵活百搭，不拘一格',
      description: '每件单品均应季而变，适配不同风格造型。灵活多变，成就无惧时间考验的穿搭良伴。',
      cta: '塑造风格',
      ctaHref: '#men-ready',
      image: IMG('hermesproduct/657805HA60_worn_1', 1920),
    },
  },
  { type: 'products', row: { products: PRODUCTS_A } },
  {
    type: 'editorial',
    block: {
      title: '重焕活力',
      description: '作品随身体自如律动。步履之间，逸态横生，散发隽永美感。',
      cta: '即刻启程',
      ctaHref: '#men-shoes',
      image: IMG('hermesproduct/262890ZHC9_front_wm_1', 1920),
    },
  },
  { type: 'products', row: { products: PRODUCTS_B } },
]

export const FOOTER_GROUPS = [
  {
    title: '服务',
    links: ['联系我们', '常见问题', '爱傌仕专卖店', '销售美妆产品的专卖店', 'Apple Watch 爱傌仕 专卖店'],
  },
  {
    title: '购物帮助',
    links: ['礼物', '高级定制', '保养与修复', '付款', '配送', '专卖店取货', '换货及退货'],
  },
  {
    title: '爱傌仕品牌',
    links: ['可持续发展', '加入爱傌仕', '财务 & 管理', '爱傌仕基金会', '集团旗下其他品牌'],
  },
  {
    title: '法律信息',
    links: ['法律条款', '隐私政策/Cookies', '法律声明', '约束性企业规则', '爱傌仕网站地图'],
  },
]

export function formatPrice(n: number): string {
  return `¥${n.toLocaleString('zh-CN')}`
}