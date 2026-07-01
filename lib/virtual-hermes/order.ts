import type { CartLine } from './cart'

export interface Address {
  name: string
  phone: string
  detail: string
}

export interface Order {
  no: string
  startMs: number
  items: CartLine[]
  address: Address
  payable: number
  status: 'allocating' | 'crafting' | 'shipping'
}

export function formatOrderNo(seed: number): string {
  const n = Math.abs(Math.trunc(seed))
  return 'HM' + n.toString().padStart(14, '0').slice(-14)
}

/** 虚拟配货进度：永远卡在「配货中」，类似画饼外卖骑手永远在路上。 */
export function allocationSnapshot(elapsedSec: number): { progress: number; status: string; etaMin: number } {
  const progress = Math.min(98, Math.floor(100 * (1 - Math.exp(-elapsedSec / 120))))
  const etaMin = Math.max(1, Math.ceil(30 * Math.exp(-elapsedSec / 180)))
  const statuses = [
    '工匠正在鞣制皮革，请耐心等待',
    '配货员在仓库迷路了',
    '橙色礼盒正在打包（大概）',
    '顺丰小哥看了眼地址，默默放下了',
    '您的 Birkin 还在出生证明办理中',
  ]
  const status = statuses[Math.floor(elapsedSec / 25) % statuses.length]
  return { progress, status, etaMin }
}