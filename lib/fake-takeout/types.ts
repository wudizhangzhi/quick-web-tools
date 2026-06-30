export interface Dish {
  id: string
  name: string
  desc: string
  /** 单价，单位元 */
  price: number
  /** 月售份数（虚构） */
  monthlySales: number
  /** 评分 0-5 */
  rating: number
  /** 缺图时的 emoji 占位 */
  emoji: string
  /** public 下的图片路径，缺省回退 emoji */
  image?: string
  tags?: string[]
}

export interface Review {
  user: string
  /** 头像 emoji */
  avatar: string
  /** 星级 1-5 */
  stars: number
  comment: string
  dishName?: string
}

export interface Shop {
  id: string
  name: string
  emoji: string
  /** 招牌一句话 */
  notice: string
  rating: number
  monthlySales: number
  /** 号称的配送时长（分钟），永远是谎言 */
  deliveryMinutes: number
  /** 配送费，单位元 */
  deliveryFee: number
  /** 起送价，单位元 */
  minOrder: number
  distanceKm: number
  dishes: Dish[]
  reviews: Review[]
}
