/**
 * 数据模型对齐美团外卖的页面字段（内容是恶搞，结构 1:1）。
 * 一切都是假的，点了也收不到。
 */

/** 促销标签（满减 / 折扣 / 新客 / 赠品 / 配送优惠）。 */
export interface Promotion {
  type: 'manjian' | 'discount' | 'new' | 'gift' | 'delivery'
  /** 展示文案，如「满30减5」「首单立减8」「赠饮料一瓶」 */
  text: string
}

/** 店内菜品分类（招牌 / 优惠 / 主食 / 小吃 / 饮品 …）。 */
export interface DishCategory {
  id: string
  name: string
}

export interface Dish {
  id: string
  /** 所属店内分类 id（对应 DishCategory.id） */
  categoryId: string
  name: string
  desc: string
  /** 现价，单位元 */
  price: number
  /** 划线原价，单位元（可选，用于「限时折扣」展示） */
  originalPrice?: number
  /** 月售份数（虚构） */
  monthlySales: number
  /** 好评率百分比 0-100 */
  goodRate: number
  /** 缺图时的 emoji 占位 */
  emoji: string
  /** public 下的图片路径，缺省回退 emoji */
  image?: string
  /** 角标，如「招牌」「必点」「第2件半价」 */
  tags?: string[]
}

/** 评价里的高频标签，如「份量足(128)」。 */
export interface ReviewTag {
  text: string
  count: number
  /** 是否好评标签（用于配色） */
  positive: boolean
}

export interface Review {
  user: string
  /** 头像 emoji */
  avatar: string
  /** 星级 1-5（支持半星，如 4.5） */
  stars: number
  comment: string
  /** 评价涉及的菜品名 */
  dishNames?: string[]
  /** 相对时间文案，如「3天前」「昨天」 */
  time: string
  /** 买家秀图（emoji 占位即可，多张） */
  images?: string[]
  /** 商家回复 */
  reply?: string
}

/** 店铺各维度评分。 */
export interface ScoreBreakdown {
  /** 口味 */
  taste: number
  /** 包装 */
  packaging: number
  /** 配送（永远很低，毕竟送不到） */
  delivery: number
}

export interface Shop {
  id: string
  name: string
  /** 店铺 logo，emoji 或图片路径 */
  logo: string
  logoImage?: string
  /** 店招大图（可选，缺省用渐变 + logo） */
  banner?: string
  /** 综合评分 0-5 */
  rating: number
  monthlySales: number
  /** 人均消费，单位元 */
  perCapita: number
  /** 号称的配送时长（分钟），永远是谎言 */
  deliveryMinutes: number
  /** 配送费，单位元 */
  deliveryFee: number
  /** 配送费划线原价（可选，营造「减配送费」效果） */
  deliveryFeeOriginal?: number
  /** 起送价，单位元 */
  minOrder: number
  distanceKm: number
  /** 商家公告 */
  notice: string
  /** 资质/服务标签，如「品质联盟」「准时宝」「蜂鸟专送」 */
  badges: string[]
  promotions: Promotion[]
  categories: DishCategory[]
  dishes: Dish[]
  reviews: Review[]
  reviewTags: ReviewTag[]
  scores: ScoreBreakdown
  /** 归属的首页频道（金刚区）key，用于筛选 */
  channel: string
}

/** 首页金刚区频道。 */
export interface HomeChannel {
  key: string
  name: string
  emoji: string
}
