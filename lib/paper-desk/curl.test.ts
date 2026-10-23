import { describe, it, expect } from 'vitest'
import { curlPoint, pullOf, solveCurl } from './curl'

const dist = (a: { along: number; height: number }, b: { along: number; height: number }) =>
  Math.hypot(a.along - b.along, a.height - b.height)

describe('curlPoint', () => {
  it('leaves the part behind the fold flat on the desk', () => {
    expect(curlPoint(-0.4, 0.2)).toEqual({ along: -0.4, height: 0 })
    expect(curlPoint(0, 0.2)).toEqual({ along: 0, height: 0 })
  })

  it('is an isometry: paper never stretches (arc length preserved)', () => {
    const R = 0.25
    const ds = 1e-4
    for (let s = 0.001; s < 2; s += 0.037) {
      const d = dist(curlPoint(s, R), curlPoint(s + ds, R))
      expect(d).toBeCloseTo(ds, 6)
    }
  })

  it('is continuous where the roll turns into the flipped flat part', () => {
    const R = 0.3
    const h = Math.PI * R
    expect(dist(curlPoint(h - 1e-7, R), curlPoint(h + 1e-7, R))).toBeLessThan(1e-5)
    expect(curlPoint(h + 0.5, R).height).toBeCloseTo(2 * R)
  })

  it('never goes below the desk', () => {
    for (let s = -1; s < 3; s += 0.05) expect(curlPoint(s, 0.2).height).toBeGreaterThanOrEqual(0)
  })
})

describe('pullOf', () => {
  it('grows monotonically with s', () => {
    let last = -Infinity
    for (let s = 0; s < 3; s += 0.01) {
      const p = pullOf(s, 0.2)
      expect(p).toBeGreaterThanOrEqual(last - 1e-12)
      last = p
    }
  })
})

describe('solveCurl', () => {
  it('is flat when nothing is pulled', () => {
    expect(solveCurl(0, 0.3, 0.15).s).toBe(0)
    expect(solveCurl(-1, 0.3, 0.15).s).toBe(0)
  })

  it('hits the requested pull and lift when the radius is allowed', () => {
    const { s, R } = solveCurl(0.3, 0.5, 0.05)
    expect(pullOf(s, R)).toBeCloseTo(0.3, 6)
    expect(curlPoint(s, R).height).toBeCloseTo(0.5, 6)
  })

  it('handles pulls past half a turn (page folded over)', () => {
    const { s, R } = solveCurl(1.5, 0.4, 0.05)
    expect(s).toBeGreaterThan(Math.PI * R)
    expect(pullOf(s, R)).toBeCloseTo(1.5, 6)
  })

  it('never bends tighter than the paper allows, but still honours the pull', () => {
    const { s, R } = solveCurl(0.8, 0.05, 0.2)
    expect(R).toBe(0.2)
    expect(pullOf(s, R)).toBeCloseTo(0.8, 6)
  })

  it('clamps s so part of the sheet stays on the desk', () => {
    expect(solveCurl(5, 0.4, 0.1, 1.2).s).toBe(1.2)
  })
})
