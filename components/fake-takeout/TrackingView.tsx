'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Phone, Headphones, Check } from 'lucide-react'
import type { Shop } from '@/lib/fake-takeout/types'
import type { CartItem } from '@/lib/fake-takeout/cart'
import { cartLines, total } from '@/lib/fake-takeout/cart'
import { deliverySnapshot, type DeliveryPhase } from '@/lib/fake-takeout/delivery'
import type { Address } from './CheckoutView'
import DishThumb from './DishThumb'

const ROUTE_D = 'M 12 16 C 30 24, 18 46, 40 52 S 70 60, 64 78 S 82 84, 86 86'
const STEPS = ['已下单', '商家接单', '骑手取餐', '配送中', '已送达']

function phaseToStep(phase: DeliveryPhase): number {
  switch (phase) {
    case 'accepted':
    case 'preparing':
      return 1
    case 'picked':
      return 2
    case 'delivering':
      return 3
  }
}

function RiderMap({ fraction }: { fraction: number }) {
  const pathRef = useRef<SVGPathElement>(null)
  const [pos, setPos] = useState({ x: 12, y: 16 })
  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    const p = path.getPointAtLength(len * fraction)
    setPos({ x: p.x, y: p.y })
  }, [fraction])

  return (
    <svg viewBox="0 0 100 100" className="h-48 w-full bg-[#E7EFE6]">
      <g stroke="#d4e3d0" strokeWidth="3" strokeLinecap="round">
        <line x1="0" y1="30" x2="100" y2="22" />
        <line x1="0" y1="64" x2="100" y2="72" />
        <line x1="26" y1="0" x2="34" y2="100" />
        <line x1="70" y1="0" x2="62" y2="100" />
      </g>
      <g fill="#dcebd7">
        <rect x="6" y="36" width="14" height="20" rx="2" />
        <rect x="44" y="8" width="12" height="12" rx="2" />
        <rect x="76" y="40" width="16" height="18" rx="2" />
        <rect x="40" y="80" width="14" height="14" rx="2" />
      </g>
      <path ref={pathRef} d={ROUTE_D} fill="none" stroke="#fb923c" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
      <text x="12" y="16" fontSize="9" textAnchor="middle" dominantBaseline="central">🏪</text>
      <text x="86" y="86" fontSize="9" textAnchor="middle" dominantBaseline="central">🏠</text>
      <g style={{ transition: 'transform 0.9s linear' }} transform={`translate(${pos.x} ${pos.y})`}>
        <circle r="6" fill="#fb923c" opacity="0.25">
          <animate attributeName="r" values="5;8;5" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <text fontSize="9" textAnchor="middle" dominantBaseline="central">🛵</text>
      </g>
    </svg>
  )
}

export default function TrackingView({
  shop,
  items,
  orderNo,
  startMs,
  address,
  onBack,
  onHome,
}: {
  shop: Shop
  items: CartItem[]
  orderNo: string
  startMs: number
  address: Address
  onBack: () => void
  onHome: () => void
}) {
  const [elapsed, setElapsed] = useState(0)
  const [feed, setFeed] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => setElapsed(Math.max(0, (Date.now() - startMs) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startMs])

  const snap = deliverySnapshot(elapsed)
  const step = phaseToStep(snap.phase)

  useEffect(() => {
    setFeed((prev) => (prev[0] === snap.status ? prev : [snap.status, ...prev].slice(0, 6)))
  }, [snap.status])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const lines = cartLines(shop, items)

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]">
      {/* 顶部状态 */}
      <div className="bg-gradient-to-b from-[#FFD100] to-[#FFE873] px-4 pb-4 pt-3">
        <button onClick={onBack} aria-label="返回" className="-ml-1 mb-1 p-1 text-gray-900">
          <ChevronLeft size={24} />
        </button>
        <p className="text-xl font-bold text-gray-900">{snap.status}</p>
        <p className="mt-1 text-sm text-gray-700">预计还有 {snap.etaMinutes} 分钟送达 · 进度 {snap.progress}%</p>

        {/* 步骤条 */}
        <div className="mt-3 flex items-center">
          {STEPS.map((s, i) => {
            const done = i <= step
            const isLast = i === STEPS.length - 1
            return (
              <div key={s} className="flex flex-1 flex-col items-center last:flex-none">
                <div className="flex w-full items-center">
                  {i > 0 && <div className={`h-0.5 flex-1 ${i <= step ? 'bg-gray-900' : 'bg-gray-900/20'}`} />}
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] ${
                      done ? 'bg-gray-900 text-white' : 'bg-white text-gray-300 ring-1 ring-gray-900/20'
                    }`}
                  >
                    {done && !isLast ? <Check size={10} /> : ''}
                  </div>
                  {!isLast && <div className={`h-0.5 flex-1 ${i < step ? 'bg-gray-900' : 'bg-gray-900/20'}`} />}
                </div>
                <span className={`mt-1 text-[10px] ${done ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{s}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* 地图 */}
        <div className="relative">
          <RiderMap fraction={snap.riderFraction} />
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            <button
              onClick={() => showToast('骑手已读不回，他真的在路上（异次元的路）')}
              className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow"
            >
              <Phone size={13} /> 联系骑手
            </button>
            <button
              onClick={() => showToast('商家正忙着给下一位顾客画饼，请稍候')}
              className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow"
            >
              <Headphones size={13} /> 联系商家
            </button>
          </div>
        </div>

        {/* 配送动态 */}
        <div className="mx-2.5 mt-2.5 rounded-xl bg-white p-4">
          <p className="mb-2 text-sm font-bold text-gray-900">配送动态</p>
          <ul className="space-y-2">
            {feed.map((line, i) => (
              <li key={`${line}-${i}`} className="flex gap-2 text-sm">
                <span className={i === 0 ? 'text-[#FF6000]' : 'text-gray-300'}>●</span>
                <span className={i === 0 ? 'text-gray-800' : 'text-gray-400'}>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 订单信息 */}
        <div className="mx-2.5 mt-2.5 rounded-xl bg-white p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <DishThumb
              image={shop.logoImage}
              emoji={shop.logo}
              alt={shop.name}
              className="h-6 w-6 flex-shrink-0 rounded"
              emojiClassName="text-base"
            />
            {shop.name}
          </p>
          <div className="space-y-1.5">
            {lines.map((line) => (
              <div key={line.dish.id} className="flex justify-between text-sm text-gray-600">
                <span className="truncate pr-2">{line.dish.name} ×{line.qty}</span>
                <span>¥{line.subtotal}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm">
            <span className="text-gray-500">实付</span>
            <span className="font-bold text-[#FF4E12]">¥{total(shop, items)}</span>
          </div>
          <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-400">
            <p>送达地址：{address.detail || '（你填的那个找不到的地方）'}{address.name ? ` · ${address.name}` : ''}</p>
            <p>订单编号：{orderNo}</p>
          </div>
        </div>

        <p className="py-3 text-center text-xs text-gray-300">画饼外卖 · 只画饼，不送达。这一单会一直「在路上」。</p>

        <div className="px-2.5">
          <button
            onClick={onHome}
            className="w-full rounded-full bg-[#FFD100] py-3 text-center font-bold text-gray-900 active:scale-[0.99]"
          >
            再画一单饼
          </button>
        </div>
      </div>

      {toast && (
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/80 px-4 py-2.5 text-center text-sm text-white">
          {toast}
        </div>
      )}
    </div>
  )
}
