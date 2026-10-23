'use client'

import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { soundPref } from './sound'

// Sound on/off, remembered per browser. Turning it on also counts as the user
// gesture browsers require before audio may play.
export default function SoundToggle({
  sfx,
  className = '',
}: {
  sfx: { setEnabled(on: boolean): void } | null
  className?: string
}) {
  const [on, setOn] = useState(true)
  useEffect(() => setOn(soundPref()), [])
  return (
    <button
      type="button"
      aria-label={on ? '关闭音效' : '打开音效'}
      title={on ? '关闭音效' : '打开音效'}
      onClick={() => {
        const next = !on
        setOn(next)
        sfx?.setEnabled(next)
      }}
      className={`grid h-9 w-9 place-items-center rounded-xl bg-white/85 text-gray-800 shadow-lg backdrop-blur hover:bg-white active:scale-95 transition ${className}`}
    >
      {on ? <Volume2 size={17} /> : <VolumeX size={17} />}
    </button>
  )
}
