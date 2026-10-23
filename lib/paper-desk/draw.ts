// Canvas 2D drawing for the paper texture and the desk surface. Browser-only.
import { FONTS, PAPER_STYLES, DESKS, type PaperConfig, type DeskKey, type PaperStyle, type TextStyle } from './config'
import { wrapText } from './wrap'

// A4 aspect, high enough to stay crisp when the viewer zooms in
export const TEX_W = 2048
export const TEX_H = 2896

export function rng(seed: number) {
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), 2246822507) ^ Math.imul(seed ^ (seed >>> 13), 3266489909)
    return ((seed ^= seed >>> 16) >>> 0) / 4294967296
  }
}

// paper base + fibres + edge tint; cached per style since it never changes while typing
const baseCache = new Map<string, HTMLCanvasElement>()
function paperBase(style: PaperStyle, tw: number, th: number): HTMLCanvasElement {
  const hit = baseCache.get(style)
  if (hit) return hit
  const def = PAPER_STYLES[style]
  const c = document.createElement('canvas')
  c.width = tw
  c.height = th
  const g = c.getContext('2d')!
  const r = rng(11)
  g.fillStyle = def.base
  g.fillRect(0, 0, tw, th)
  // soft blotches so the fill is not perfectly flat
  for (let i = 0; i < 60; i++) {
    const x = r() * tw, y = r() * th, rad = 80 + r() * 260
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(${def.fiber},${0.025 + r() * 0.03})`)
    gr.addColorStop(1, `rgba(${def.fiber},0)`)
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  // fibres
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(${def.fiber},${r() * 0.08})`
    g.save()
    g.translate(r() * tw, r() * th)
    g.rotate(r() * Math.PI)
    g.fillRect(0, 0, 2 + r() * 10, 1)
    g.restore()
  }
  if (style === 'kraft') {
    for (let i = 0; i < 1500; i++) {
      g.fillStyle = `rgba(60,35,15,${r() * 0.18})`
      g.fillRect(r() * tw, r() * th, 1 + r() * 3, 1 + r() * 3)
    }
  }
  if (style === 'vintage') {
    // a couple of faint tea stains
    for (let i = 0; i < 3; i++) {
      const x = r() * tw, y = r() * th, rad = 120 + r() * 200
      g.strokeStyle = `rgba(150,100,40,${0.08 + r() * 0.06})`
      g.lineWidth = 6 + r() * 10
      g.beginPath()
      g.ellipse(x, y, rad, rad * (0.85 + r() * 0.2), r() * 3, 0, Math.PI * 2)
      g.stroke()
    }
  }
  // darker, aged edges
  const edge = style === 'vintage' ? 0.35 : style === 'kraft' ? 0.18 : 0.07
  const vg = g.createRadialGradient(tw / 2, th / 2, Math.min(tw, th) * 0.35, tw / 2, th / 2, Math.hypot(tw, th) * 0.55)
  vg.addColorStop(0, `rgba(${def.fiber},0)`)
  vg.addColorStop(1, `rgba(${def.fiber},${edge})`)
  g.fillStyle = vg
  g.fillRect(0, 0, tw, th)
  baseCache.set(style, c)
  return c
}

// Thin display fonts (handwriting / brush) wash out at reading size; trace each glyph
// with a same-colour stroke to give the ink some body.
function inkText(g: CanvasRenderingContext2D, st: TextStyle, text: string, x: number, y: number, size: number) {
  g.fillText(text, x, y)
  const weight = st.font === 'hand' ? 0.035 : st.font === 'brush' ? 0.02 : 0
  if (!weight) return
  g.strokeStyle = g.fillStyle
  g.lineWidth = size * weight
  g.lineJoin = 'round'
  g.strokeText(text, x, y)
}

const fontOf = (st: TextStyle, size: number, bold = false) => {
  const f = FONTS[st.font]
  return `${bold ? Math.max(f.weight, 600) : f.weight} ${size}px ${f.family}`
}

export interface Layout {
  titleSize: number
  bodySize: number
  lineH: number
  bodyTop: number
  lines: string[]
  signY: number // baseline of the signature line
}

// Pick the largest body size (≤ requested) whose wrapped text still fits the page.
export function layout(g: CanvasRenderingContext2D, cfg: PaperConfig, tw: number, th: number): Layout {
  const margin = tw * 0.1
  const maxW = tw - margin * 2
  const titleSize = Math.round(tw * 0.068 * cfg.fontScale)
  const titleH = cfg.title.trim() ? titleSize * 2 : 0
  const footH = (cfg.signature.trim() ? 1 : 0) + (cfg.date.trim() ? 1 : 0)
  let bodySize = Math.round(tw * 0.04 * cfg.fontScale)
  for (;;) {
    const lineH = bodySize * 1.75
    g.font = fontOf(cfg.bodyStyle, bodySize)
    const lines = wrapText(cfg.body, maxW, (s) => g.measureText(s).width)
    const bodyTop = margin + titleH + bodySize * 0.4
    const signY = bodyTop + lines.length * lineH + lineH * 1.3
    const bottom = signY + footH * lineH * 1.1
    if (bottom <= th - margin * 0.6 || bodySize <= 12) return { titleSize, bodySize, lineH, bodyTop, lines, signY }
    bodySize = Math.floor(bodySize * 0.93)
  }
}

/** Draws the paper and returns where the stamp should land (texture px). */
export function drawPaper(c: HTMLCanvasElement, cfg: PaperConfig): { x: number; y: number } {
  const tw = TEX_W, th = TEX_H
  if (c.width !== tw || c.height !== th) {
    c.width = tw
    c.height = th
  }
  const g = c.getContext('2d')!
  g.globalCompositeOperation = 'source-over'
  g.globalAlpha = 1
  g.drawImage(paperBase(cfg.style, tw, th), 0, 0)

  const def = PAPER_STYLES[cfg.style]
  const L = layout(g, cfg, tw, th)
  const margin = tw * 0.1

  // ruling, aligned to the body baselines so handwriting sits on the lines
  if (def.line && (cfg.style === 'lined' || cfg.style === 'vintage')) {
    g.strokeStyle = def.line
    g.lineWidth = 2
    for (let y = L.bodyTop + L.lineH * 0.72; y < th - margin * 0.4; y += L.lineH) {
      g.beginPath()
      g.moveTo(margin * 0.5, y)
      g.lineTo(tw - margin * 0.5, y)
      g.stroke()
    }
    if (cfg.style === 'lined') {
      g.strokeStyle = 'rgba(210,70,70,.35)'
      g.beginPath()
      g.moveTo(margin * 0.8, 0)
      g.lineTo(margin * 0.8, th)
      g.stroke()
    }
  } else if (def.line && cfg.style === 'grid') {
    const step = L.lineH / 2
    g.strokeStyle = def.line
    g.lineWidth = 1.5
    for (let x = (tw % step) / 2; x < tw; x += step) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, th); g.stroke()
    }
    for (let y = (th % step) / 2; y < th; y += step) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(tw, y); g.stroke()
    }
  }

  // ink soaks into the paper: multiply blend + slight transparency
  g.globalCompositeOperation = 'multiply'
  g.globalAlpha = 1
  g.textBaseline = 'alphabetic'

  if (cfg.title.trim()) {
    const center = cfg.titleAlign === 'center'
    g.textAlign = center ? 'center' : 'left'
    g.fillStyle = cfg.titleStyle.color
    g.font = fontOf(cfg.titleStyle, L.titleSize, true)
    if ('letterSpacing' in g && center) (g as { letterSpacing: string }).letterSpacing = `${Math.round(L.titleSize * 0.12)}px`
    inkText(g, cfg.titleStyle, cfg.title, center ? tw / 2 : margin, margin + L.titleSize, L.titleSize)
    if ('letterSpacing' in g) (g as { letterSpacing: string }).letterSpacing = '0px'
  }

  g.textAlign = 'left'
  g.fillStyle = cfg.bodyStyle.color
  g.font = fontOf(cfg.bodyStyle, L.bodySize)
  const handBody = cfg.bodyStyle.font === 'hand' || cfg.bodyStyle.font === 'brush'
  const r = rng(cfg.body.length + 3)
  L.lines.forEach((line, i) => {
    const y = L.bodyTop + i * L.lineH + L.lineH * 0.6
    // hand fonts get a hair of per-line drift so it doesn't look typeset
    const drift = handBody ? (r() - 0.5) * L.bodySize * 0.12 : 0
    inkText(g, cfg.bodyStyle, line, margin + drift, y, L.bodySize)
  })

  let y = L.signY
  g.textAlign = 'right'
  g.fillStyle = cfg.signStyle.color
  const xr = tw - margin
  if (cfg.signature.trim()) {
    const size = Math.round(L.bodySize * 1.08)
    g.font = fontOf(cfg.signStyle, size)
    inkText(g, cfg.signStyle, cfg.signature, xr, y, size)
    y += L.lineH * 1.1
  }
  if (cfg.date.trim()) {
    const size = Math.round(L.bodySize * 0.85)
    g.font = fontOf(cfg.signStyle, size)
    inkText(g, cfg.signStyle, cfg.date, xr, y, size)
  }
  g.globalCompositeOperation = 'source-over'
  g.globalAlpha = 1
  g.textAlign = 'left'
  // the stamp sits over the signature block, like a real approval chop
  return { x: tw * 0.66, y: Math.min(L.signY + L.lineH * 0.2, th - tw * 0.2) }
}

// A red approval chop: double ring + text, with patchy ink. Drawn once per text.
const stampCache = new Map<string, HTMLCanvasElement>()
export function stampImage(text: string): HTMLCanvasElement {
  const hit = stampCache.get(text)
  if (hit) return hit
  const S = 420
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  const red = '#c8102e'
  g.translate(S / 2, S / 2)
  g.strokeStyle = red
  g.fillStyle = red
  g.lineWidth = 16
  g.beginPath(); g.arc(0, 0, S / 2 - 14, 0, Math.PI * 2); g.stroke()
  g.lineWidth = 5
  g.beginPath(); g.arc(0, 0, S / 2 - 40, 0, Math.PI * 2); g.stroke()
  // star on top, text in the middle
  g.font = '700 54px "Noto Serif SC", "Songti SC", serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('★', 0, -S * 0.25)
  const chars = [...text]
  const size = Math.min(120, Math.floor((S * 0.66) / Math.max(1, chars.length)))
  g.font = `900 ${size}px "Noto Serif SC", "Songti SC", serif`
  g.fillText(text, 0, S * 0.04)
  g.lineWidth = 4
  g.beginPath(); g.moveTo(-S * 0.3, S * 0.2); g.lineTo(S * 0.3, S * 0.2); g.stroke()
  // patchy ink: knock out speckles so it reads as a real rubber stamp
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.globalCompositeOperation = 'destination-out'
  const r = rng(99)
  for (let i = 0; i < 900; i++) {
    g.globalAlpha = 0.25 + r() * 0.6
    g.beginPath()
    g.arc(r() * S, r() * S, 1 + r() * 4, 0, Math.PI * 2)
    g.fill()
  }
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'
  stampCache.set(text, c)
  return c
}

/** Composite the stamp onto the paper. t: 0 → in the air (big, faint), 1 → pressed. */
export function drawStamp(g: CanvasRenderingContext2D, text: string, at: { x: number; y: number }, t: number) {
  const img = stampImage(text)
  const e = 1 - (1 - Math.min(1, Math.max(0, t))) ** 3
  const size = TEX_W * 0.3 * (1 + (1 - e) * 1.4)
  g.save()
  g.globalCompositeOperation = 'multiply'
  g.globalAlpha = 0.88 * e
  g.translate(at.x, at.y)
  g.rotate(-0.22)
  g.drawImage(img, -size / 2, -size / 2, size, size)
  g.restore()
}

// Soft rounded-rect shadow under the sheet so a flat paper still sits on the desk.
export function contactShadow(): HTMLCanvasElement {
  const W = 512, H = 640
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  g.filter = 'blur(18px)'
  g.fillStyle = 'rgba(0,0,0,.55)'
  g.beginPath()
  g.roundRect(56, 56, W - 112, H - 112, 6)
  g.fill()
  return c
}

// Fine grayscale noise used as a bump map so light catches the paper grain.
export function paperGrain(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  const img = g.createImageData(512, 512)
  const r = rng(5)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + r() * 20
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return c
}

export function drawDesk(key: DeskKey): HTMLCanvasElement {
  const def = DESKS[key]
  const S = 2048
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  const r = rng(23)
  g.fillStyle = def.base
  g.fillRect(0, 0, S, S)
  // planks
  const planks = 5
  const pw = S / planks
  for (let p = 0; p < planks; p++) {
    g.fillStyle = `rgba(${def.grain},${r() * 0.12})`
    g.fillRect(p * pw, 0, pw, S)
  }
  // grain: wavy lines running along each plank
  for (let p = 0; p < planks; p++) {
    const x0 = p * pw
    const phase = r() * 10
    for (let l = 0; l < 70; l++) {
      const lx = x0 + r() * pw
      const amp = 4 + r() * 18
      const freq = 0.002 + r() * 0.004
      g.strokeStyle = `rgba(${def.grain},${0.04 + r() * (key === 'white' ? 0.05 : 0.14)})`
      g.lineWidth = 1 + r() * 3
      g.beginPath()
      for (let y = 0; y <= S; y += 16) {
        const x = lx + Math.sin(y * freq + phase + l) * amp + Math.sin(y * freq * 3.1 + l) * amp * 0.3
        if (y === 0) g.moveTo(x, y)
        else g.lineTo(x, y)
      }
      g.stroke()
    }
    // a knot now and then
    if (r() > 0.45) {
      const kx = x0 + pw * (0.25 + r() * 0.5), ky = r() * S
      for (let k = 0; k < 9; k++) {
        g.strokeStyle = `rgba(${def.grain},${0.12 - k * 0.01})`
        g.lineWidth = 2
        g.beginPath()
        g.ellipse(kx, ky, 8 + k * 7, 20 + k * 16, 0, 0, Math.PI * 2)
        g.stroke()
      }
    }
    // seam between planks
    g.fillStyle = `rgba(${def.grain},.35)`
    g.fillRect(x0, 0, 3, S)
  }
  // a faint coffee ring, because every desk has one
  g.strokeStyle = 'rgba(80,40,10,.13)'
  g.lineWidth = 9
  g.beginPath()
  g.arc(S * 0.8, S * 0.3, 92, 0.3, Math.PI * 2 - 0.2)
  g.stroke()
  return c
}

// Top panel of the shredder: brand + a small status display.
export function shredderPanel(status: string, active: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 160
  const g = c.getContext('2d')!
  const grd = g.createLinearGradient(0, 0, 0, 160)
  grd.addColorStop(0, '#3a3d43')
  grd.addColorStop(1, '#2a2c31')
  g.fillStyle = grd
  g.fillRect(0, 0, 1024, 160)
  g.fillStyle = 'rgba(255,255,255,.06)'
  for (let x = 0; x < 1024; x += 6) g.fillRect(x, 0, 2, 160)
  g.fillStyle = '#d9dce2'
  g.font = '700 54px "Noto Sans SC", "PingFang SC", sans-serif'
  g.textBaseline = 'middle'
  g.fillText('碎纸机', 60, 82)
  g.fillStyle = 'rgba(217,220,226,.55)'
  g.font = '600 26px "Noto Sans SC", sans-serif'
  g.fillText('SHRED · 保密级 P-4', 250, 86)
  // status display
  g.fillStyle = '#0d1a12'
  g.beginPath()
  g.roundRect(700, 40, 230, 80, 10)
  g.fill()
  g.fillStyle = active ? '#ff5a4f' : '#56f08a'
  g.font = '700 38px "Noto Sans SC", sans-serif'
  g.textAlign = 'center'
  g.fillText(status, 815, 82)
  g.beginPath()
  g.arc(965, 80, 14, 0, Math.PI * 2)
  g.fill()
  return c
}
