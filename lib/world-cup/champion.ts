import type { Predictions, Team, WorldCupData } from './types'

// The team a user picked to win the whole thing, derived from their pick on the
// final. Knockout matches only carry real teams once FIFA fills the bracket, so
// this stays null until the final has real sides AND the user has guessed it.
// 'draw' is impossible in knockout, so it never yields a champion.
export function championPick(predictions: Predictions, data: WorldCupData): Team | null {
  const final = data.matches.find((m) => m.stage === 'final')
  if (!final) return null

  const pick = predictions[final.id]
  if (pick !== 'home' && pick !== 'away') return null

  const team = pick === 'home' ? final.home : final.away
  if (!team.code || team.placeholder != null) return null

  return team
}
