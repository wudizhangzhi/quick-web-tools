import { describe, it, expect } from 'vitest'
import { featuredMatch } from './featured'
import type { Match, Predictions, WorldCupData } from './types'

const T = (iso: string) => new Date(iso).getTime()
const NOW = T('2026-06-15T00:00:00Z')

function m(
  id: string,
  kickoff: string,
  result: Match['result'],
  teams: [string | null, string | null] = ['X', 'Y'],
): Match {
  return {
    id,
    stage: 'group',
    group: 'A',
    round: null,
    slot: null,
    kickoff,
    home: { code: teams[0], name: teams[0] ?? '待定', placeholder: teams[0] ? null : '待定' },
    away: { code: teams[1], name: teams[1] ?? '待定', placeholder: teams[1] ? null : '待定' },
    result,
  }
}

function data(matches: Match[]): WorldCupData {
  return { competitionId: '17', title: 't', matches }
}

describe('featuredMatch', () => {
  it('returns null when there are no predictions', () => {
    const d = data([m('a', '2026-06-16T00:00:00Z', null)])
    expect(featuredMatch({}, d, { now: NOW })).toBeNull()
  })

  it('only considers matches the user predicted', () => {
    const d = data([
      m('a', '2026-06-16T00:00:00Z', null),
      m('b', '2026-06-17T00:00:00Z', null),
    ])
    const preds: Predictions = { b: 'home' }
    expect(featuredMatch(preds, d, { now: NOW })?.match.id).toBe('b')
  })

  it('prefers unresolved matches even when a resolved one is nearer in time', () => {
    const d = data([
      m('resolved-near', '2026-06-15T01:00:00Z', 'home'),
      m('unresolved-far', '2026-06-20T00:00:00Z', null),
    ])
    const preds: Predictions = { 'resolved-near': 'home', 'unresolved-far': 'away' }
    const f = featuredMatch(preds, d, { now: NOW })
    expect(f?.match.id).toBe('unresolved-far')
    expect(f?.choice).toBe('away')
  })

  it('among unresolved, picks the one nearest in time to now', () => {
    const d = data([
      m('far', '2026-06-25T00:00:00Z', null),
      m('near', '2026-06-16T00:00:00Z', null),
      m('mid', '2026-06-19T00:00:00Z', null),
    ])
    const preds: Predictions = { far: 'home', near: 'draw', mid: 'away' }
    const f = featuredMatch(preds, d, { now: NOW })
    expect(f?.match.id).toBe('near')
    expect(f?.choice).toBe('draw')
  })

  it('falls back to a random predicted match when all are resolved', () => {
    const d = data([
      m('a', '2026-06-10T00:00:00Z', 'home'),
      m('b', '2026-06-11T00:00:00Z', 'away'),
      m('c', '2026-06-12T00:00:00Z', 'draw'),
    ])
    const preds: Predictions = { a: 'home', b: 'home', c: 'away' }
    // rng -> index 1 of the predicted pool (data order: a,b,c)
    const f = featuredMatch(preds, d, { now: NOW, rng: () => 0.5 })
    expect(f?.match.id).toBe('b')
  })

  it('ignores predicted matches whose teams are not yet filled', () => {
    const d = data([
      m('tbd', '2026-06-16T00:00:00Z', null, [null, null]),
      m('real', '2026-06-18T00:00:00Z', null, ['ARG', 'FRA']),
    ])
    const preds: Predictions = { tbd: 'home', real: 'home' }
    expect(featuredMatch(preds, d, { now: NOW })?.match.id).toBe('real')
  })
})
