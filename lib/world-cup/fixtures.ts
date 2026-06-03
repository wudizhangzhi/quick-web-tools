import type { Choice, Match, Stage, WorldCupData } from './types'
import rawData from '@/data/worldcup-2026.json'

const data = rawData as unknown as WorldCupData

export function loadData(): WorldCupData {
  return data
}

export function indexById(d: WorldCupData = data): Map<string, Match> {
  return new Map(d.matches.map((m) => [m.id, m]))
}

export function getMatch(id: string, d: WorldCupData = data): Match | undefined {
  return d.matches.find((m) => m.id === id)
}

export function isKnockout(stage: Stage): boolean {
  return stage !== 'group'
}

// A knockout slot whose teams aren't decided yet (group stage not finished).
export function isPlaceholder(match: Match): boolean {
  return match.home.placeholder != null || match.away.placeholder != null
}

// Locked once kickoff has passed — predictions can no longer be made/changed.
export function isLocked(match: Match, now: number): boolean {
  return new Date(match.kickoff).getTime() <= now
}

// Predictable: both teams known and the match hasn't kicked off.
export function isPredictable(match: Match, now: number): boolean {
  return !isPlaceholder(match) && !isLocked(match, now)
}

// Group matches allow draw; knockout matches are home/away only.
export function validChoice(stage: Stage, choice: Choice): boolean {
  if (choice === 'draw') return stage === 'group'
  return choice === 'home' || choice === 'away'
}
