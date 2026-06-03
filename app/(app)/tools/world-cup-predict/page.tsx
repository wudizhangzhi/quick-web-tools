import type { Metadata } from 'next'
import { loadData } from '@/lib/world-cup/fixtures'
import WorldCupClient from './WorldCupClient'

export const metadata: Metadata = {
  title: '世界杯竞猜 - Quick Web Tools',
  description: '随机猜一场世界杯比赛，记录命中率，生成专属晋级树分享给朋友',
}

export default function WorldCupPredictPage() {
  const data = loadData()
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{data.title}竞猜</h1>
        <p className="mt-1 text-sm text-gray-500">
          随机猜一场比赛，每天更新真实赛果统计你的命中率，生成专属晋级树分享给朋友
        </p>
      </header>
      <WorldCupClient data={data} />
    </div>
  )
}
