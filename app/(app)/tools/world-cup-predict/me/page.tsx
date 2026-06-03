import type { Metadata } from 'next'
import { loadData } from '@/lib/world-cup/fixtures'
import DashboardClient from '../DashboardClient'

export const metadata: Metadata = {
  title: '我的晋级树 - 世界杯竞猜',
  description: '查看你的世界杯预测战绩与晋级树',
}

export default function WorldCupMePage() {
  const data = loadData()
  return <DashboardClient data={data} />
}
