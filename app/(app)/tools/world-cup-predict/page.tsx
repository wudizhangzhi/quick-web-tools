import type { Metadata } from 'next'
import { loadData } from '@/lib/world-cup/fixtures'
import PlayClient from './PlayClient'

export const metadata: Metadata = {
  title: '世界杯竞猜 - Quick Web Tools',
  description: '随机猜一场世界杯比赛，记录命中率，生成专属晋级树分享给朋友',
}

export default function WorldCupPredictPage() {
  const data = loadData()
  return <PlayClient data={data} />
}
