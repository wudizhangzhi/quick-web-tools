import type { CartItem } from './cart'

/** 收货地址。 */
export interface Address {
  name: string
  phone: string
  detail: string
}

/** 一笔下单记录（持久化到 localStorage，永远「配送中」）。 */
export interface Order {
  no: string
  /** 下单时刻（ms），配送状态机以此推进 */
  startMs: number
  shopId: string
  shopName: string
  shopLogo: string
  items: CartItem[]
  address: Address
  remark: string
  /** 实付金额 */
  payable: number
}

/**
 * 生成画饼外卖订单号。确定性：相同 seed 得到相同结果（便于测试），
 * 调用方在运行时传入 `Date.now()` 之类的种子即可获得"看起来唯一"的单号。
 * 形如 HB + 14 位数字。
 */
export function formatOrderNo(seed: number): string {
  const n = Math.abs(Math.trunc(seed))
  return 'HB' + n.toString().padStart(14, '0').slice(-14)
}
