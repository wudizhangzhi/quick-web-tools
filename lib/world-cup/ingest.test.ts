import { describe, it, expect } from 'vitest'
import {
  mapStageFromEnglish,
  parseGroupLetter,
  roundForStage,
  mapTeam,
  mapResult,
  toMatch,
  assignBracketSlots,
  buildMatches,
  mergeData,
  type FifaMatch,
  type FifaTeam,
} from './ingest'
import type { Match, Stage, WorldCupData } from './types'

function team(over: Partial<NonNullable<FifaTeam>> = {}): FifaTeam {
  return {
    Score: null,
    IdTeam: '100',
    IdCountry: 'MEX',
    Abbreviation: 'MEX',
    TeamName: [{ Locale: 'zh-CN', Description: '墨西哥' }],
    ...over,
  }
}

function fifa(over: Partial<FifaMatch> = {}): FifaMatch {
  return {
    IdMatch: '1',
    Date: '2026-06-11T19:00:00Z',
    StageName: [{ Locale: 'en-GB', Description: 'First Stage' }],
    GroupName: [{ Locale: 'en-GB', Description: 'Group A' }],
    MatchStatus: 1,
    Winner: null,
    HomeTeamScore: null,
    AwayTeamScore: null,
    Home: team({ IdTeam: '100', Abbreviation: 'MEX' }),
    Away: team({ IdTeam: '200', Abbreviation: 'RSA', TeamName: [{ Locale: 'zh-CN', Description: '南非' }] }),
    ...over,
  }
}

describe('mapStageFromEnglish', () => {
  it('maps each stage; qf/sf/third never collapse to final', () => {
    expect(mapStageFromEnglish('First Stage')).toBe('group')
    expect(mapStageFromEnglish('Group Stage')).toBe('group')
    expect(mapStageFromEnglish('Round of 32')).toBe('r32')
    expect(mapStageFromEnglish('Round of 16')).toBe('r16')
    expect(mapStageFromEnglish('Quarter-final')).toBe('qf')
    expect(mapStageFromEnglish('Semi-final')).toBe('sf')
    expect(mapStageFromEnglish('Play-off for third place')).toBe('third')
    expect(mapStageFromEnglish('Final')).toBe('final')
  })
})

describe('parseGroupLetter', () => {
  it('extracts the group letter, not the G in "Group" (regression)', () => {
    expect(parseGroupLetter('Group A')).toBe('A')
    expect(parseGroupLetter('Group G')).toBe('G')
    expect(parseGroupLetter('Group L')).toBe('L')
  })
  it('handles Chinese forms', () => {
    expect(parseGroupLetter('A 组')).toBe('A')
    expect(parseGroupLetter('L组')).toBe('L')
  })
  it('returns null when no group letter', () => {
    expect(parseGroupLetter('Knockout')).toBeNull()
  })
})

describe('roundForStage', () => {
  it('indexes knockout rounds and nulls the rest', () => {
    expect(roundForStage('r32')).toBe(0)
    expect(roundForStage('r16')).toBe(1)
    expect(roundForStage('qf')).toBe(2)
    expect(roundForStage('sf')).toBe(3)
    expect(roundForStage('final')).toBe(4)
    expect(roundForStage('group')).toBeNull()
    expect(roundForStage('third')).toBeNull()
  })
})

describe('mapTeam', () => {
  it('maps a real team', () => {
    expect(mapTeam(team())).toEqual({ code: 'MEX', name: '墨西哥', placeholder: null })
  })
  it('marks an undecided slot as placeholder', () => {
    expect(mapTeam(null)).toEqual({ code: null, name: '待定', placeholder: '待定' })
    expect(mapTeam(team({ IdTeam: null }))).toEqual({ code: null, name: '待定', placeholder: '待定' })
  })
})

describe('mapResult', () => {
  it('group: home/draw/away from scores', () => {
    expect(mapResult(fifa({ HomeTeamScore: 2, AwayTeamScore: 1 }), 'group')).toBe('home')
    expect(mapResult(fifa({ HomeTeamScore: 1, AwayTeamScore: 1 }), 'group')).toBe('draw')
    expect(mapResult(fifa({ HomeTeamScore: 0, AwayTeamScore: 3 }), 'group')).toBe('away')
  })
  it('group: null when not played', () => {
    expect(mapResult(fifa(), 'group')).toBeNull()
  })
  it('knockout: resolves by Winner team id', () => {
    const m = fifa({ Winner: '200', Home: team({ IdTeam: '100' }), Away: team({ IdTeam: '200' }) })
    expect(mapResult(m, 'r16')).toBe('away')
  })
  it('knockout: resolves by score, never draw', () => {
    expect(mapResult(fifa({ HomeTeamScore: 3, AwayTeamScore: 2 }), 'qf')).toBe('home')
  })
  it('knockout: penalties decide a 120-minute draw', () => {
    const m = fifa({ HomeTeamScore: 1, AwayTeamScore: 1, HomeTeamPenaltyScore: 4, AwayTeamPenaltyScore: 5 })
    expect(mapResult(m, 'qf')).toBe('away')
  })
  it('knockout: undecided draw without penalties is null (never draw)', () => {
    expect(mapResult(fifa({ HomeTeamScore: 1, AwayTeamScore: 1 }), 'qf')).toBeNull()
  })
})

describe('toMatch', () => {
  it('uses English for stage/group, Chinese for names', () => {
    const zh = fifa({
      StageName: [{ Locale: 'zh-CN', Description: '第一阶段' }],
      GroupName: [{ Locale: 'zh-CN', Description: 'A 组' }],
    })
    const en = fifa()
    const m = toMatch(zh, en)
    expect(m.id).toBe('fifa-1')
    expect(m.stage).toBe('group')
    expect(m.group).toBe('A')
    expect(m.home.name).toBe('墨西哥')
    expect(m.away.name).toBe('南非')
  })
  it('knockout match has null group and a round', () => {
    const en = fifa({ StageName: [{ Locale: 'en-GB', Description: 'Round of 16' }], GroupName: null })
    const m = toMatch(en, en)
    expect(m.stage).toBe('r16')
    expect(m.group).toBeNull()
    expect(m.round).toBe(1)
  })
})

describe('assignBracketSlots', () => {
  it('numbers each round 0..n-1 ordered by kickoff', () => {
    const mk = (id: string, round: number, kickoff: string): Match => ({
      id,
      stage: 'r32' as Stage,
      group: null,
      round,
      slot: null,
      kickoff,
      home: { code: null, name: '待定', placeholder: '待定' },
      away: { code: null, name: '待定', placeholder: '待定' },
      result: null,
    })
    const matches = [
      mk('b', 0, '2026-06-29T19:00:00Z'),
      mk('a', 0, '2026-06-28T19:00:00Z'),
      mk('c', 1, '2026-07-03T19:00:00Z'),
    ]
    assignBracketSlots(matches)
    expect(matches.find((m) => m.id === 'a')!.slot).toBe(0)
    expect(matches.find((m) => m.id === 'b')!.slot).toBe(1)
    expect(matches.find((m) => m.id === 'c')!.slot).toBe(0)
  })
})

describe('buildMatches', () => {
  it('joins zh names with en stage and sorts group-first', () => {
    const ko = fifa({
      IdMatch: '9',
      StageName: [{ Locale: 'en-GB', Description: 'Final' }],
      GroupName: null,
      Date: '2026-07-19T19:00:00Z',
      Home: null,
      Away: null,
    })
    const grp = fifa({ IdMatch: '1' })
    const out = buildMatches([ko, grp], [ko, grp])
    expect(out[0].stage).toBe('group') // group sorted before final
    expect(out[1].stage).toBe('final')
    expect(out[0].group).toBe('A')
  })
})

describe('mergeData', () => {
  const base = (matches: Match[]): WorldCupData => ({ competitionId: '17', title: 't', matches })
  const m = (id: string, result: Match['result'] = null): Match => ({
    id,
    stage: 'group',
    group: 'A',
    round: null,
    slot: null,
    kickoff: '2026-06-11T19:00:00Z',
    home: { code: 'X', name: 'X', placeholder: null },
    away: { code: 'Y', name: 'Y', placeholder: null },
    result,
  })

  it('returns incoming when no existing', () => {
    const incoming = base([m('a')])
    expect(mergeData(null, incoming)).toBe(incoming)
  })
  it('incoming fields win, existing-only ids preserved', () => {
    const existing = base([m('a', 'home'), m('old')])
    const incoming = base([m('a', 'draw')])
    const merged = mergeData(existing, incoming)
    expect(merged.matches.find((x) => x.id === 'a')!.result).toBe('draw')
    expect(merged.matches.find((x) => x.id === 'old')).toBeTruthy()
  })
})
