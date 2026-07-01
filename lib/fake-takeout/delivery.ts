/**
 * 配送状态机——画饼外卖的核心玄机。
 *
 * 一切都是 `elapsedSec`（下单后经过的秒数）的纯函数，便于测试与断言：
 * - 进度单调不减，渐近逼近 99，**永远不到 100、永远不 delivered**。
 * - 状态文案在「配送中」阶段按时间轮换荒诞句子。
 * 你永远收不到货。
 */

export type DeliveryPhase = 'accepted' | 'preparing' | 'picked' | 'delivering'

/** 进度上限，永远差最后 1%。 */
export const MAX_PROGRESS = 99

/** 阶段切换的时间边界（秒）。 */
const ACCEPTED_UNTIL = 8
const PREPARING_UNTIL = 20
const PICKED_UNTIL = 35

/** 渐近时间常数：越大爬升越慢。 */
const TAU = 28

/** 荒诞状态文案每条停留的秒数。 */
const STATUS_INTERVAL = 9

export const PHASE_LABELS: Record<DeliveryPhase, string> = {
  accepted: '商家已接单',
  preparing: '商家正在火速备餐',
  picked: '骑手已取餐，正在赶来',
  delivering: '配送中',
}

/** 「配送中」阶段轮换播放的荒诞理由。 */
export const ABSURD_STATUSES: string[] = [
  '骑手正帮上一单的顾客找狗',
  '骑手电瓶车没电了，正在推车前进',
  '骑手在等第 8 个红绿灯',
  '骑手说你家这栋楼是异次元入口，正在寻找现实出口',
  '系统检测到你太饿了，正在为你延长期待感',
  '骑手被一只猫拦下，正在进行外交谈判',
  '骑手走错了平行宇宙，正在折返',
  '前方修路，骑手正在原地修心',
  '骑手在楼下，但电梯把他送去了别的城市',
  '订单进度 99%，已稳定保持 4 分钟',
  '骑手正在为你的餐拍一张永远不会送达的买家秀',
  '骑手说马上到，这是他第 12 次说马上到',
  '导航把骑手带进了一条只出不进的胡同',
  '骑手正在和你家的门牌号进行哲学探讨',
  '餐还是热的，热情正在冷却',
]

/** 当前所处阶段。 */
export function deliveryPhase(elapsedSec: number): DeliveryPhase {
  if (elapsedSec < ACCEPTED_UNTIL) return 'accepted'
  if (elapsedSec < PREPARING_UNTIL) return 'preparing'
  if (elapsedSec < PICKED_UNTIL) return 'picked'
  return 'delivering'
}

/** 进度（0..99 的整数），单调不减，渐近逼近 99，永不到 100。 */
export function deliveryProgress(elapsedSec: number): number {
  if (elapsedSec <= 0) return 0
  const p = MAX_PROGRESS * (1 - Math.exp(-elapsedSec / TAU))
  return Math.min(MAX_PROGRESS, Math.round(p))
}

/** 当前状态文案。配送中阶段轮换荒诞理由，其余阶段为正经阶段名。 */
export function deliveryStatus(elapsedSec: number): string {
  const phase = deliveryPhase(elapsedSec)
  if (phase !== 'delivering') return PHASE_LABELS[phase]
  const i =
    Math.floor((elapsedSec - PICKED_UNTIL) / STATUS_INTERVAL) %
    ABSURD_STATUSES.length
  return ABSURD_STATUSES[i]
}

/**
 * 骑手在路径上的位置（0..0.9 的比例）。跟随进度推进，但封顶在 0.9：
 * 永远停在你家楼下不远处，到不了门口。
 */
export function riderFraction(elapsedSec: number): number {
  return Math.min(0.9, deliveryProgress(elapsedSec) / 100)
}

/** 号称的剩余分钟数，恒 >= 1：永远「还有最后一分钟」。 */
export function etaMinutes(elapsedSec: number): number {
  return Math.max(1, Math.round((MAX_PROGRESS - deliveryProgress(elapsedSec)) / 5))
}

export interface DeliverySnapshot {
  phase: DeliveryPhase
  progress: number
  status: string
  riderFraction: number
  etaMinutes: number
}

/** 某一时刻的完整配送快照。 */
export function deliverySnapshot(elapsedSec: number): DeliverySnapshot {
  return {
    phase: deliveryPhase(elapsedSec),
    progress: deliveryProgress(elapsedSec),
    status: deliveryStatus(elapsedSec),
    riderFraction: riderFraction(elapsedSec),
    etaMinutes: etaMinutes(elapsedSec),
  }
}
