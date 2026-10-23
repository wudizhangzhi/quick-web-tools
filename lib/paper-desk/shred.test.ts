import { describe, it, expect } from 'vitest'
import { PILE_REACH, SHRED_DEPTH, shredPoint, stripParams } from './shred'

const p = { phase: 1, freq: 6, sway: 2, spread: 0.1 }

describe('shredPoint', () => {
  it('leaves the part not yet fed in flat and in place', () => {
    expect(shredPoint(-0.5, p)).toEqual({ dz: 0.5, dx: 0, y: 0.003, hidden: false })
  })

  it('hides the part inside the machine', () => {
    expect(shredPoint(SHRED_DEPTH / 2, p).hidden).toBe(true)
  })

  it('piles strips just past the outlet instead of letting them run off', () => {
    for (let d = SHRED_DEPTH + 0.01; d < 4; d += 0.1) {
      const o = shredPoint(d, p)
      expect(o.hidden).toBe(false)
      expect(o.dz).toBeLessThanOrEqual(-SHRED_DEPTH)
      expect(o.dz).toBeGreaterThanOrEqual(-(SHRED_DEPTH + PILE_REACH))
    }
  })

  it('never puts paper below the desk', () => {
    for (let d = -1; d < 4; d += 0.03) expect(shredPoint(d, p).y).toBeGreaterThan(0)
  })

  it('is continuous at the outlet (strips do not jump when they emerge)', () => {
    const a = shredPoint(SHRED_DEPTH + 1e-6, p)
    const b = shredPoint(SHRED_DEPTH + 2e-6, p)
    expect(Math.abs(a.dz - b.dz) + Math.abs(a.dx - b.dx) + Math.abs(a.y - b.y)).toBeLessThan(1e-3)
  })
})

describe('stripParams', () => {
  it('fans strips outward from the centre', () => {
    const fixed = () => 0.5
    expect(stripParams(0, 10, fixed).spread).toBeLessThan(0)
    expect(stripParams(9, 10, fixed).spread).toBeGreaterThan(0)
  })
})
