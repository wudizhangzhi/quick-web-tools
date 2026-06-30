'use client'

import { Wifi, BatteryFull, Signal } from 'lucide-react'

/** 假手机状态栏，营造「这是一个 App」的氛围。深色文字版（用在浅色头部上）。 */
export default function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? 'text-gray-900' : 'text-white'
  return (
    <div className={`flex items-center justify-between px-5 pt-2 pb-1 text-xs font-semibold ${color}`}>
      <span>20:08</span>
      <div className="flex items-center gap-1">
        <Signal size={13} />
        <Wifi size={13} />
        <BatteryFull size={15} />
      </div>
    </div>
  )
}
