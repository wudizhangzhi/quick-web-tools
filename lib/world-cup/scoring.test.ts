import { describe, it, expect } from 'vitest'
import { isCorrect, computeStats } from './scoring'
import type { Match, Predictions, WorldCupData } from './types'

function m(id: string, result: Match['result'], stage: Match['stage'] = 'group'): Match {
  return {
    id,
    stage,
    group: stage === 'group' ? 'A' : null,
    round: null,
    slot: null,
    kickoff: '2026-06-11T19:00:00Z',
    home: { code: 'X', name: 'X', placeholder: null },
    away: { code: 'Y', name: 'Y', placeholder: null },
    result,
  }
}

describe('isCorrect', () => {
  it('false until resolved, then exact match', () => {
    expect(isCorrect(m('a', null), 'home')).toBe(false)
    expect(isCorrect(m('a', 'home'), 'home')).toBe(true)
    expect(isCorrect(m('a', 'draw'), 'home')).toBe(false)
  })
})

describe('computeStats', () => {
  const data: WorldCupData = {
    competitionId: '17',
    title: 't',
    matches: [m('a', 'home'), m('b', 'away'), m('c', null), m('d', 'draw')],
  }

  it('counts predicted/resolved/correct and accuracy', () => {
    const preds: Predictions = { a: 'home', b: 'home', c: 'home', d: 'draw' }
    // a correct, b wrong, c unresolved, d correct -> resolved 3, correct 2
    expect(computeStats(preds, data)).toEqual({
      predicted: 4,
      resolved: 3,
      correct: 2,
      accuracy: 2 / 3,
    })
  })

  it('ignores predictions for unknown matches', () => {
    const preds: Predictions = { a: 'home', ghost: 'away' }
    expect(computeStats(preds, data)).toEqual({ predicted: 1, resolved: 1, correct: 1, accuracy: 1 })
  })

  it('accuracy is 0 with nothing resolved', () => {
    const preds: Predictions = { c: 'home' }
    expect(computeStats(preds, data)).toEqual({ predicted: 1, resolved: 0, correct: 0, accuracy: 0 })
  })

  it('empty predictions', () => {
    expect(computeStats({}, data)).toEqual({ predicted: 0, resolved: 0, correct: 0, accuracy: 0 })
  })
})
