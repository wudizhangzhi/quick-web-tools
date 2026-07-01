import { describe, it, expect } from 'vitest'
import {
  deliveryPhase,
  deliveryProgress,
  deliveryStatus,
  riderFraction,
  etaMinutes,
  deliverySnapshot,
  ABSURD_STATUSES,
  MAX_PROGRESS,
} from './delivery'

describe('deliveryPhase', () => {
  it('walks through accepted → preparing → picked → delivering', () => {
    expect(deliveryPhase(0)).toBe('accepted')
    expect(deliveryPhase(10)).toBe('preparing')
    expect(deliveryPhase(25)).toBe('picked')
    expect(deliveryPhase(40)).toBe('delivering')
  })

  it('never leaves the delivering phase, no matter how long you wait', () => {
    expect(deliveryPhase(60)).toBe('delivering')
    expect(deliveryPhase(60 * 60)).toBe('delivering')
    expect(deliveryPhase(60 * 60 * 24 * 365)).toBe('delivering')
  })
})

describe('deliveryProgress — the core trick', () => {
  it('starts at 0', () => {
    expect(deliveryProgress(0)).toBe(0)
  })

  it('is monotonically non-decreasing', () => {
    let prev = -1
    for (let t = 0; t <= 2000; t += 1) {
      const p = deliveryProgress(t)
      expect(p).toBeGreaterThanOrEqual(prev)
      prev = p
    }
  })

  it('NEVER reaches 100 — you never receive the goods', () => {
    for (let t = 0; t <= 60 * 60 * 24; t += 7) {
      expect(deliveryProgress(t)).toBeLessThan(100)
      expect(deliveryProgress(t)).toBeLessThanOrEqual(MAX_PROGRESS)
    }
  })

  it('asymptotically approaches the 99 cap for very large elapsed', () => {
    expect(deliveryProgress(10_000)).toBe(MAX_PROGRESS)
  })
})

describe('deliveryStatus', () => {
  it('shows the plain phase label before delivering', () => {
    expect(deliveryStatus(0)).toBe('商家已接单')
    expect(deliveryStatus(10)).toBe('商家正在火速备餐')
    expect(deliveryStatus(25)).toBe('骑手已取餐，正在赶来')
  })

  it('rotates through absurd statuses while delivering', () => {
    expect(deliveryStatus(35)).toBe(ABSURD_STATUSES[0])
    expect(deliveryStatus(35 + 9)).toBe(ABSURD_STATUSES[1])
  })

  it('wraps around the absurd status list deterministically', () => {
    const oneCycle = 9 * ABSURD_STATUSES.length
    expect(deliveryStatus(35 + oneCycle)).toBe(ABSURD_STATUSES[0])
  })

  it('always returns a non-empty string', () => {
    for (let t = 0; t <= 5000; t += 3) {
      expect(deliveryStatus(t).length).toBeGreaterThan(0)
    }
  })
})

describe('riderFraction', () => {
  it('never reaches the door (capped below 1)', () => {
    for (let t = 0; t <= 10_000; t += 11) {
      expect(riderFraction(t)).toBeLessThanOrEqual(0.9)
    }
  })
})

describe('etaMinutes', () => {
  it('is always at least 1 — forever "last minute"', () => {
    for (let t = 0; t <= 10_000; t += 13) {
      expect(etaMinutes(t)).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('deliverySnapshot', () => {
  it('bundles the full state and never signals delivered', () => {
    const snap = deliverySnapshot(99999)
    expect(snap.phase).toBe('delivering')
    expect(snap.progress).toBeLessThan(100)
    expect(snap.status).toBeTruthy()
    expect(snap.riderFraction).toBeLessThanOrEqual(0.9)
    expect(snap.etaMinutes).toBeGreaterThanOrEqual(1)
  })
})
