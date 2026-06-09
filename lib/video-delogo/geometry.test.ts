import { describe, it, expect } from 'vitest'
import { pointerToReal, toPercent, type Rect } from './geometry'

describe('pointerToReal', () => {
  it('maps the box centre to the video centre', () => {
    const rect: Rect = { left: 100, top: 50, width: 800, height: 450 }
    expect(pointerToReal(500, 275, rect, 1920, 1080)).toEqual({ x: 960, y: 540 })
  })

  it('scales X and Y independently when the box aspect ratio differs', () => {
    // Regression: a box 400×100 over a 1920×1080 video. The old code used a
    // single width-derived scale for both axes, putting the Y coordinate at
    // 240 instead of 540 — "drawn at A, shows at B".
    const rect: Rect = { left: 0, top: 0, width: 400, height: 100 }
    expect(pointerToReal(200, 50, rect, 1920, 1080)).toEqual({ x: 960, y: 540 })
  })

  it('maps the bottom-right corner to (videoW, videoH)', () => {
    const rect: Rect = { left: 10, top: 20, width: 640, height: 360 }
    expect(pointerToReal(650, 380, rect, 1280, 720)).toEqual({ x: 1280, y: 720 })
  })

  it('returns origin for a zero-sized rect', () => {
    expect(pointerToReal(5, 5, { left: 0, top: 0, width: 0, height: 0 }, 100, 100)).toEqual({
      x: 0,
      y: 0,
    })
  })

  it('round-trips: pointer -> real -> percent lands back on the pointer', () => {
    const rect: Rect = { left: 30, top: 70, width: 500, height: 130 }
    const videoW = 1920
    const videoH = 1080
    const clientX = 222
    const clientY = 140
    const real = pointerToReal(clientX, clientY, rect, videoW, videoH)
    const screenX = rect.left + (toPercent(real.x, videoW) / 100) * rect.width
    const screenY = rect.top + (toPercent(real.y, videoH) / 100) * rect.height
    expect(screenX).toBeCloseTo(clientX, 6)
    expect(screenY).toBeCloseTo(clientY, 6)
  })
})

describe('toPercent', () => {
  it('computes a percentage of the total', () => {
    expect(toPercent(540, 1080)).toBe(50)
  })
  it('returns 0 for a non-positive total', () => {
    expect(toPercent(10, 0)).toBe(0)
  })
})
