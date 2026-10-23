'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { FONTS, type PaperConfig } from '@/lib/paper-desk/config'
import type { PaperScene } from './scene'
import { createSfx } from './sound'

const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Long+Cang&family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@500&family=Noto+Serif+SC:wght@500;600;900&family=Caveat&display=swap'

function ensureFontCss() {
  if (document.querySelector(`link[href="${FONT_CSS}"]`)) return
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = FONT_CSS
  document.head.appendChild(l)
}

// Canvas text never triggers webfont downloads, and CJK fonts are split into
// unicode-range slices — so ask for exactly the glyphs on the page.
export async function loadGlyphs(cfg: PaperConfig) {
  const req = (font: keyof typeof FONTS, weight: number, text: string) =>
    document.fonts.load(`${weight} 40px ${FONTS[font].family.split(',')[0]}`, text || 'a')
  await Promise.race([
    Promise.all([
      req(cfg.titleStyle.font, Math.max(FONTS[cfg.titleStyle.font].weight, 600), cfg.title),
      req(cfg.bodyStyle.font, FONTS[cfg.bodyStyle.font].weight, cfg.body),
      req(cfg.signStyle.font, FONTS[cfg.signStyle.font].weight, cfg.signature + cfg.date),
      cfg.stamp ? document.fonts.load('900 40px "Noto Serif SC"', `${cfg.stampText}★`) : null,
    ]),
    new Promise((r) => setTimeout(r, 4000)),
  ]).catch(() => {})
}

/**
 * Boots the 3D scene into `holder` once `enabled`. three.js is imported here so
 * it never runs during SSR and stays out of the first-load bundle.
 */
export function usePaperScene(
  holder: RefObject<HTMLDivElement>,
  cfg: PaperConfig,
  enabled: boolean,
  view: { stamped?: boolean; shredded?: boolean; dropIn?: boolean; padBottom?: number; margin?: number } = {},
) {
  const sceneRef = useRef<PaperScene | null>(null)
  const sfxRef = useRef<ReturnType<typeof createSfx> | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const initRef = useRef({ cfg, view })
  initRef.current = { cfg, view }

  useEffect(() => {
    if (!enabled) return
    let disposed = false
    ensureFontCss()
    ;(async () => {
      try {
        const [THREE, { createPaperScene }] = await Promise.all([import('three'), import('./scene')])
        await loadGlyphs(initRef.current.cfg)
        if (disposed || !holder.current) return
        sfxRef.current ??= createSfx()
        sceneRef.current = createPaperScene(holder.current, THREE, initRef.current.cfg, {
          ...initRef.current.view,
          sfx: sfxRef.current,
        })
        setReady(true)
      } catch (e) {
        console.error(e)
        setError('3D 场景加载失败，可能是浏览器不支持 WebGL')
      }
    })()
    return () => {
      disposed = true
      sceneRef.current?.dispose()
      sceneRef.current = null
      setReady(false)
    }
  }, [enabled, holder])

  return { sceneRef, sfxRef, ready, error }
}
