/** 店铺分享链接（纯前端，无后端）。 */
export function shopShareUrl(shopId: string): string {
  if (typeof window === 'undefined') return `/wm?shop=${shopId}`
  const url = new URL('/wm', window.location.origin)
  url.searchParams.set('shop', shopId)
  return url.toString()
}

export function shopShareText(shopName: string): string {
  return `我在画饼外卖发现了「${shopName}」，下单了也送不到，快来一起画饼 🫓`
}