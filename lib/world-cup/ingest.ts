// Pure transforms from the FIFA calendar API shape into our WorldCupData schema.
// Kept side-effect free so it can be unit tested without network.

import type { Match, MatchResult, Stage, Team, WorldCupData } from './types'
import { KNOCKOUT_ROUNDS } from './types'

export type FifaLocale = { Locale: string; Description: string }

export type FifaTeam = {
  Score: number | null
  IdTeam: string | null
  IdCountry: string | null
  Abbreviation: string | null
  TeamName: FifaLocale[] | null
} | null

export type FifaMatch = {
  IdMatch: string
  Date: string
  StageName: FifaLocale[] | null
  GroupName: FifaLocale[] | null
  MatchStatus: number
  Winner: string | null
  HomeTeamScore: number | null
  AwayTeamScore: number | null
  HomeTeamPenaltyScore?: number | null
  AwayTeamPenaltyScore?: number | null
  Home: FifaTeam
  Away: FifaTeam
}

const PLACEHOLDER = '待定'

export function pickDescription(arr: FifaLocale[] | null | undefined): string {
  if (!arr || arr.length === 0) return ''
  return arr[0]?.Description ?? ''
}

// Map FIFA's English StageName to our stage. Order matters: 'Quarter-final' and
// 'Semi-final' both contain "final", so they must be checked before Final.
export function mapStageFromEnglish(englishStageName: string): Stage {
  const s = englishStageName.toLowerCase()
  if (s.includes('round of 32')) return 'r32'
  if (s.includes('round of 16')) return 'r16'
  if (s.includes('quarter')) return 'qf'
  if (s.includes('semi')) return 'sf'
  if (s.includes('third')) return 'third' // "Play-off for third place"
  if (s.includes('final')) return 'final'
  return 'group' // "First Stage" / "Group Stage"
}

export function roundForStage(stage: Stage): number | null {
  const idx = KNOCKOUT_ROUNDS.indexOf(stage)
  return idx >= 0 ? idx : null
}

export function parseGroupLetter(groupName: string): string | null {
  // English "Group A" — anchor on the word so we don't grab the G in "Group".
  const en = groupName.match(/group\s*([A-L])\b/i)
  if (en) return en[1].toUpperCase()
  // Chinese "A 组" / "A组".
  const zh = groupName.match(/([A-L])\s*组/i)
  if (zh) return zh[1].toUpperCase()
  // Fallback: a standalone A–L letter.
  const any = groupName.match(/\b([A-L])\b/i)
  return any ? any[1].toUpperCase() : null
}

export function mapTeam(team: FifaTeam): Team {
  if (team && team.IdTeam) {
    const name = pickDescription(team.TeamName) || team.Abbreviation || team.IdCountry || PLACEHOLDER
    return {
      code: team.Abbreviation || team.IdCountry || null,
      name,
      placeholder: null,
    }
  }
  return { code: null, name: PLACEHOLDER, placeholder: PLACEHOLDER }
}

// Resolve a match outcome from scores / Winner. Returns null when not yet decided.
// Knockout matches never return 'draw' (extra time / penalties decide a winner).
export function mapResult(m: FifaMatch, stage: Stage): MatchResult {
  const hs = m.HomeTeamScore ?? m.Home?.Score ?? null
  const as = m.AwayTeamScore ?? m.Away?.Score ?? null

  if (stage === 'group') {
    if (typeof hs !== 'number' || typeof as !== 'number') return null
    if (hs > as) return 'home'
    if (hs < as) return 'away'
    return 'draw'
  }

  // Knockout: trust an explicit Winner team id first.
  if (m.Winner) {
    if (m.Home?.IdTeam && m.Winner === m.Home.IdTeam) return 'home'
    if (m.Away?.IdTeam && m.Winner === m.Away.IdTeam) return 'away'
  }
  if (typeof hs === 'number' && typeof as === 'number') {
    if (hs > as) return 'home'
    if (hs < as) return 'away'
    // Drawn after 120' — decided on penalties.
    const hp = m.HomeTeamPenaltyScore ?? null
    const ap = m.AwayTeamPenaltyScore ?? null
    if (typeof hp === 'number' && typeof ap === 'number' && hp !== ap) {
      return hp > ap ? 'home' : 'away'
    }
  }
  return null
}

// Build a single Match. `enMatch` supplies the stable English stage/group label;
// `zhMatch` (same IdMatch) supplies Chinese team names + scores + winner.
export function toMatch(zhMatch: FifaMatch, enMatch: FifaMatch | undefined): Match {
  const stageEn = pickDescription(enMatch?.StageName) || pickDescription(zhMatch.StageName)
  const stage = mapStageFromEnglish(stageEn)
  const groupSrc = pickDescription(enMatch?.GroupName) || pickDescription(zhMatch.GroupName)
  const group = stage === 'group' ? parseGroupLetter(groupSrc) : null

  return {
    id: `fifa-${zhMatch.IdMatch}`,
    stage,
    group,
    round: roundForStage(stage),
    slot: null, // assigned by assignBracketSlots
    kickoff: zhMatch.Date,
    home: mapTeam(zhMatch.Home),
    away: mapTeam(zhMatch.Away),
    result: mapResult(zhMatch, stage),
  }
}

// Assign bracket position within each knockout round, ordered by kickoff then id.
// slot i feeds slot floor(i/2) of the next round. Third-place playoff is left null.
// Mutates and returns the same array.
export function assignBracketSlots(matches: Match[]): Match[] {
  for (let r = 0; r < KNOCKOUT_ROUNDS.length; r++) {
    const inRound = matches
      .filter((m) => m.round === r)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id.localeCompare(b.id))
    inRound.forEach((m, i) => {
      m.slot = i
    })
  }
  return matches
}

export function buildMatches(zhMatches: FifaMatch[], enMatches: FifaMatch[]): Match[] {
  const enById = new Map(enMatches.map((m) => [m.IdMatch, m]))
  const matches = zhMatches.map((zh) => toMatch(zh, enById.get(zh.IdMatch)))
  // Group stage first, then knockout rounds, then date — stable, human-readable file.
  matches.sort(
    (a, b) =>
      stageOrder(a.stage) - stageOrder(b.stage) ||
      a.kickoff.localeCompare(b.kickoff) ||
      a.id.localeCompare(b.id),
  )
  return assignBracketSlots(matches)
}

const STAGE_ORDER: Stage[] = ['group', 'r32', 'r16', 'qf', 'sf', 'third', 'final']
function stageOrder(stage: Stage): number {
  const i = STAGE_ORDER.indexOf(stage)
  return i >= 0 ? i : STAGE_ORDER.length
}

// Merge freshly fetched matches into existing data without dropping ids a user may
// have predicted. Incoming fields win; existing-only ids are preserved.
export function mergeData(existing: WorldCupData | null, incoming: WorldCupData): WorldCupData {
  if (!existing) return incoming
  const incomingIds = new Set(incoming.matches.map((m) => m.id))
  const preserved = existing.matches.filter((m) => !incomingIds.has(m.id))
  return {
    ...incoming,
    matches: [...incoming.matches, ...preserved],
  }
}
