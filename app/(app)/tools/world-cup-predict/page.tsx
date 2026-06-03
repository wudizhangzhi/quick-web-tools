import type { Metadata } from 'next'
import { loadData } from '@/lib/world-cup/fixtures'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: '世界杯竞猜 - Quick Web Tools',
  description: '查看你的世界杯预测战绩与晋级树，分享给朋友，或继续竞猜',
}

export default function WorldCupPredictPage() {
  const data = loadData()
  return <DashboardClient data={data} />
}
