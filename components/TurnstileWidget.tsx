'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

type Props = { siteKey: string; onToken: (token: string) => void }

export default function TurnstileWidget({ siteKey, onToken }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey) return
    const render = () => {
      if (!containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        'error-callback': () => onToken(''),
        'expired-callback': () => onToken(''),
        theme: 'auto',
      })
    }

    if (window.turnstile) {
      render()
    } else {
      const id = 'cf-turnstile-script'
      if (!document.getElementById(id)) {
        const s = document.createElement('script')
        s.id = id
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
        s.async = true
        s.defer = true
        document.head.appendChild(s)
      }
      window.onTurnstileLoad = render
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, onToken])

  return <div ref={containerRef} />
}
