import type { Choice, Match, Predictions, WorldCupData } from './types'

export type FeaturedMatch = { match: Match; choice: Choice }

// Pick one predicted matchup to spotlight on the share poster, showing the
// user's own pick (never the real result). Priority cascade:
//   1. prefer matches with no result yet (the prediction is still "live");
//   2. among those, the one whose kickoff is nearest to `now`;
//   3. if every prediction is already resolved, fall back to a random one.
// Only matches with both teams filled in are eligible, so the card always has
// real flags/names to show.
export function featuredMatch(
  predictions: Predictions,
  data: WorldCupData,
  opts: { now?: number; rng?: () => number } = {},
): FeaturedMatch | null {
  const now = opts.now ?? Date.now()
  const rng = opts.rng ?? Math.random

  const predicted = data.matches.filter(
    (m) => predictions[m.id] && m.home.code && m.away.code,
  )
  if (predicted.length === 0) return null

  const unresolved = predicted.filter((m) => m.result == null)

  if (unresolved.length > 0) {
    const nearest = unresolved.reduce((best, m) =>
      Math.abs(new Date(m.kickoff).getTime() - now) <
      Math.abs(new Date(best.kickoff).getTime() - now)
        ? m
        : best,
    )
    return { match: nearest, choice: predictions[nearest.id] }
  }

  const pick = predicted[Math.floor(rng() * predicted.length)]
  return { match: pick, choice: predictions[pick.id] }
}
