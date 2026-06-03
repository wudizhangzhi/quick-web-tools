import type { Metadata } from 'next'
import { loadData } from '@/lib/world-cup/fixtures'
import PlayClient from '@/components/world-cup/PlayClient'

export const metadata: Metadata = {
  title: '世界杯竞猜 - 开始竞猜',
  description: '随机猜一场世界杯比赛的胜平负 / 晋级走向',
}

export default function WorldCupPlayPage() {
  const data = loadData()
  return <PlayClient data={data} />
}
