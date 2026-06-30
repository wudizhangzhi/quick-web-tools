/**
 * 生成画饼外卖订单号。确定性：相同 seed 得到相同结果（便于测试），
 * 调用方在运行时传入 `Date.now()` 之类的种子即可获得"看起来唯一"的单号。
 * 形如 HB + 14 位数字。
 */
export function formatOrderNo(seed: number): string {
  const n = Math.abs(Math.trunc(seed))
  return 'HB' + n.toString().padStart(14, '0').slice(-14)
}
