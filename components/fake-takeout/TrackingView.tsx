'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Receipt } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import { deliverySnapshot } from '@/lib/fake-takeout/delivery'
import type { Address } from './CheckoutView'

/** 地图路径（viewBox 0 0 100 100 用户坐标系），从店铺蜿蜒到你家。 */
const ROUTE_D = 'M 12 16 C 30 24, 18 46, 40 52 S 70 60, 64 78 S 82 84, 86 86'

function RiderMap({ fraction }: { fraction: number }) {
  const pathRef = useRef<SVGPathElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 12, y: 16 })

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    const p = path.getPointAtLength(len * fraction)
    setPos({ x: p.x, y: p.y })
  }, [fraction])

  return (
    <svg viewBox="0 0 100 100" className="h-56 w-full rounded-2xl bg-[#eaf3e8]">
      {/* 路网装饰 */}
      <g stroke="#d4e3d0" strokeWidth="3" strokeLinecap="round">
        <line x1="0" y1="30" x2="100" y2="22" />
        <line x1="0" y1="64" x2="100" y2="72" />
        <line x1="26" y1="0" x2="34" y2="100" />
        <line x1="70" y1="0" x2="62" y2="100" />
      </g>
      {/* 街区 */}
      <g fill="#dcebd7">
        <rect x="6" y="36" width="14" height="20" rx="2" />
        <rect x="44" y="8" width="12" height="12" rx="2" />
        <rect x="76" y="40" width="16" height="18" rx="2" />
        <rect x="40" y="80" width="14" height="14" rx="2" />
      </g>
      {/* 配送路线 */}
      <path
        ref={pathRef}
        d={ROUTE_D}
        fill="none"
        stroke="#fb923c"
        strokeWidth="2"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
      {/* 店铺 */}
      <text x="12" y="16" fontSize="9" textAnchor="middle" dominantBaseline="central">
        🏪
      </text>
      {/* 你家 */}
      <text x="86" y="86" fontSize="9" textAnchor="middle" dominantBaseline="central">
        🏠
      </text>
      {/* 骑手 */}
      <g style={{ transition: 'transform 0.9s linear' }} transform={`translate(${pos.x} ${pos.y})`}>
        <circle r="6" fill="#fb923c" opacity="0.25">
          <animate attributeName="r" values="5;8;5" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <text fontSize="9" textAnchor="middle" dominantBaseline="central">
          🛵
        </text>
      </g>
    </svg>
  )
}

export default function TrackingView({
  shop,
  orderNo,
  startMs,
  address,
}: {
  shop: Shop
  orderNo: string
  startMs: number
  address: Address
}) {
  const [elapsed, setElapsed] = useState(0)
  const [feed, setFeed] = useState<string[]>([])

  // 每秒推进一次，纯靠时间驱动状态机
  useEffect(() => {
    const tick = () => setElapsed(Math.max(0, (Date.now() - startMs) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startMs])

  const snap = deliverySnapshot(elapsed)

  // 状态变化时记入动态流
  useEffect(() => {
    setFeed((prev) => (prev[0] === snap.status ? prev : [snap.status, ...prev].slice(0, 6)))
  }, [snap.status])

  return (
    <div className="space-y-3 p-3">
      {/* 顶部状态 */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 p-4 text-white shadow-sm">
        <p className="text-lg font-bold">{snap.status}</p>
        <div className="mt-1 flex items-center gap-1 text-sm text-white/90">
          <Clock size={14} /> 预计还有 {snap.etaMinutes} 分钟送达
        </div>
        {/* 进度条 */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white transition-all duration-700"
            style={{ width: `${snap.progress}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-white/80">{snap.progress}%</p>
      </div>

      <RiderMap fraction={snap.riderFraction} />

      {/* 动态流 */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-bold text-gray-800">配送动态</p>
        <ul className="space-y-2">
          {feed.map((line, i) => (
            <li key={`${line}-${i}`} className="flex gap-2 text-sm">
              <span className={i === 0 ? 'text-orange-500' : 'text-gray-300'}>●</span>
              <span className={i === 0 ? 'text-gray-800' : 'text-gray-400'}>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 订单信息 */}
      <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
        <p className="mb-2 flex items-center gap-1.5 font-bold text-gray-800">
          <Receipt size={16} className="text-orange-500" /> 订单信息
        </p>
        <div className="space-y-1 text-gray-500">
          <p>店铺：{shop.name}</p>
          <p>
            送至：{address.detail || '（你填的那个找不到的地方）'}
            {address.name ? ` · ${address.name}` : ''}
          </p>
          <p>订单号：{orderNo}</p>
        </div>
      </div>

      <p className="pb-2 text-center text-xs text-gray-300">
        画饼外卖 · 只画饼，不送达。这一单会一直「在路上」。
      </p>
    </div>
  )
}
