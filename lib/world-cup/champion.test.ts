import { describe, it, expect } from 'vitest'
import { championPick } from './champion'
import type { Match, Predictions, WorldCupData } from './types'

function finalMatch(home: Match['home'], away: Match['away']): Match {
  return {
    id: 'fifa-final',
    stage: 'final',
    group: null,
    round: 4,
    slot: 0,
    kickoff: '2026-07-19T19:00:00Z',
    home,
    away,
    result: null,
  }
}

const tbd = { code: null, name: '待定', placeholder: '待定' }
const arg = { code: 'ARG', name: '阿根廷', placeholder: null }
const fra = { code: 'FRA', name: '法国', placeholder: null }

function dataWith(final: Match): WorldCupData {
  return { competitionId: '17', title: 't', matches: [final] }
}

describe('championPick', () => {
  it('returns null when there is no final', () => {
    const data: WorldCupData = { competitionId: '17', title: 't', matches: [] }
    expect(championPick({}, data)).toBeNull()
  })

  it('returns null when the user has not picked the final', () => {
    expect(championPick({}, dataWith(finalMatch(arg, fra)))).toBeNull()
  })

  it('returns null when the picked side is still TBD', () => {
    const preds: Predictions = { 'fifa-final': 'home' }
    expect(championPick(preds, dataWith(finalMatch(tbd, fra)))).toBeNull()
  })

  it('resolves a home pick to the home team', () => {
    const preds: Predictions = { 'fifa-final': 'home' }
    expect(championPick(preds, dataWith(finalMatch(arg, fra)))).toEqual(arg)
  })

  it('resolves an away pick to the away team', () => {
    const preds: Predictions = { 'fifa-final': 'away' }
    expect(championPick(preds, dataWith(finalMatch(arg, fra)))).toEqual(fra)
  })

  it('ignores a draw pick (knockout has no draw winner)', () => {
    const preds: Predictions = { 'fifa-final': 'draw' }
    expect(championPick(preds, dataWith(finalMatch(arg, fra)))).toBeNull()
  })
})
