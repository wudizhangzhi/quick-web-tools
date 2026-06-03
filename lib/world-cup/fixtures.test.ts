import { describe, it, expect } from 'vitest'
import {
  isKnockout,
  isPlaceholder,
  isLocked,
  isPredictable,
  validChoice,
  loadData,
} from './fixtures'
import type { Match } from './types'

function m(over: Partial<Match> = {}): Match {
  return {
    id: 'a',
    stage: 'group',
    group: 'A',
    round: null,
    slot: null,
    kickoff: '2026-06-11T19:00:00Z',
    home: { code: 'X', name: 'X', placeholder: null },
    away: { code: 'Y', name: 'Y', placeholder: null },
    result: null,
    ...over,
  }
}

const BEFORE = new Date('2026-06-11T18:00:00Z').getTime()
const AFTER = new Date('2026-06-11T20:00:00Z').getTime()

describe('isKnockout', () => {
  it('group is not knockout, others are', () => {
    expect(isKnockout('group')).toBe(false)
    expect(isKnockout('r32')).toBe(true)
    expect(isKnockout('final')).toBe(true)
  })
})

describe('isPlaceholder', () => {
  it('true when either side is unfilled', () => {
    expect(isPlaceholder(m())).toBe(false)
    expect(isPlaceholder(m({ home: { code: null, name: '待定', placeholder: '待定' } }))).toBe(true)
  })
})

describe('isLocked / isPredictable', () => {
  it('locks at kickoff', () => {
    expect(isLocked(m(), BEFORE)).toBe(false)
    expect(isLocked(m(), AFTER)).toBe(true)
  })
  it('predictable only when teams known and not kicked off', () => {
    expect(isPredictable(m(), BEFORE)).toBe(true)
    expect(isPredictable(m(), AFTER)).toBe(false)
    const ph = m({ stage: 'r32', away: { code: null, name: '待定', placeholder: '待定' } })
    expect(isPredictable(ph, BEFORE)).toBe(false)
  })
})

describe('validChoice', () => {
  it('draw only in group stage', () => {
    expect(validChoice('group', 'draw')).toBe(true)
    expect(validChoice('group', 'home')).toBe(true)
    expect(validChoice('r16', 'draw')).toBe(false)
    expect(validChoice('r16', 'home')).toBe(true)
    expect(validChoice('final', 'away')).toBe(true)
  })
})

describe('loadData (real seed file)', () => {
  it('has 104 matches across all 12 groups', () => {
    const d = loadData()
    expect(d.matches.length).toBe(104)
    const groups = new Set(d.matches.filter((x) => x.stage === 'group').map((x) => x.group))
    expect([...groups].sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])
  })
})
