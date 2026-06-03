import type { Choice, Match, Predictions, WorldCupData } from './types'

export type Stats = {
  predicted: number // predictions that reference a real match
  resolved: number // of those, how many have a known result
  correct: number // of resolved, how many matched
  accuracy: number // correct / resolved, 0 when resolved === 0
}

// A prediction is correct only once the match has a result and it matches the pick.
export function isCorrect(match: Match, choice: Choice): boolean {
  return match.result != null && match.result === choice
}

export function computeStats(predictions: Predictions, data: WorldCupData): Stats {
  const byId = new Map(data.matches.map((m) => [m.id, m]))
  let predicted = 0
  let resolved = 0
  let correct = 0

  for (const [matchId, choice] of Object.entries(predictions)) {
    const match = byId.get(matchId)
    if (!match) continue // stale prediction (match removed) — ignore
    predicted += 1
    if (match.result != null) {
      resolved += 1
      if (isCorrect(match, choice)) correct += 1
    }
  }

  return {
    predicted,
    resolved,
    correct,
    accuracy: resolved > 0 ? correct / resolved : 0,
  }
}
