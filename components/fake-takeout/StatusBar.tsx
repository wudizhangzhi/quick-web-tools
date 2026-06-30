'use client'

import { useEffect, useState } from 'react'
import { Wifi, BatteryFull, Signal } from 'lucide-react'

function nowHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 假手机状态栏。时间用真实当前时间，每 15s 刷新；挂载后才渲染以避免水合不一致。 */
export default function StatusBar({ dark = false }: { dark?: boolean }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    setTime(nowHHMM())
    const id = setInterval(() => setTime(nowHHMM()), 15000)
    return () => clearInterval(id)
  }, [])

  const color = dark ? 'text-gray-900' : 'text-white'
  return (
    <div className={`flex items-center justify-between px-5 pt-2 pb-1 text-xs font-semibold ${color}`}>
      <span className="tabular-nums">{time || ' '}</span>
      <div className="flex items-center gap-1">
        <Signal size={13} />
        <Wifi size={13} />
        <BatteryFull size={15} />
      </div>
    </div>
  )
}
