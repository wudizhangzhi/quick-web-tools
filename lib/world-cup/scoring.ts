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

// A playful rank earned from the share of correct predictions, surfaced once
// at least one match is resolved. `pct` is the integer accuracy (0–100).
export type AccuracyTier = { title: string; emoji: string }

export function accuracyTitle(pct: number): AccuracyTier {
  if (pct >= 100) return { title: '你是穿越来的吧？', emoji: '🔮' }
  if (pct >= 90) return { title: '绝世预言家', emoji: '🧙' }
  if (pct >= 80) return { title: '神算子', emoji: '🎯' }
  if (pct >= 70) return { title: '资深球探', emoji: '⚽' }
  if (pct >= 60) return { title: '懂球老炮', emoji: '🧠' }
  if (pct >= 50) return { title: '半仙在世', emoji: '☯️' }
  if (pct >= 40) return { title: '跟着感觉走', emoji: '🎲' }
  if (pct >= 25) return { title: '重在参与', emoji: '🌱' }
  if (pct >= 1) return { title: '偶尔蒙对', emoji: '🍀' }
  return { title: '反向预言家', emoji: '🙃' }
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
