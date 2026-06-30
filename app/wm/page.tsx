import type { Metadata } from 'next'
import TakeoutApp from '@/components/fake-takeout/TakeoutApp'

export const metadata: Metadata = {
  title: '画饼外卖 - 只画饼，不送达',
  description: '逛店铺、看买家秀、加购物车、填地址、下单，看骑手在地图上永远送不到你家。',
}

export default function FakeTakeoutPage() {
  return <TakeoutApp />
}
