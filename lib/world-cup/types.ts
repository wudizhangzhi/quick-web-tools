// World Cup prediction — shared domain types.

export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final'

// A user's pick for a match. Knockout matches never use 'draw'.
export type Choice = 'home' | 'draw' | 'away'

// Resolved outcome of a match (null until the result is known).
export type MatchResult = 'home' | 'draw' | 'away' | null

export type Team = {
  code: string | null // FIFA abbreviation / country code, e.g. "MEX"; null when TBD
  name: string // Chinese display name, or a placeholder label like "待定"
  placeholder: string | null // non-null while the slot is not yet filled by a real team
}

export type Match = {
  id: string // stable id "fifa-<IdMatch>"; user predictions are keyed on this
  stage: Stage
  group: string | null // "A".."L" for group stage, else null
  round: number | null // knockout round index r32=0 r16=1 qf=2 sf=3 final=4; null for group/third
  slot: number | null // position within the knockout round (bracket order); null for group/third
  kickoff: string // ISO 8601
  home: Team
  away: Team
  result: MatchResult
}

export type WorldCupData = {
  competitionId: string // FIFA idCompetition, so the scraper is reusable next tournament
  title: string
  matches: Match[]
}

// matchId -> choice
export type Predictions = Record<string, Choice>

// Ordered knockout rounds used for bracket layout (third-place playoff handled separately).
export const KNOCKOUT_ROUNDS: Stage[] = ['r32', 'r16', 'qf', 'sf', 'final']
