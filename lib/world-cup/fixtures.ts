import type { Choice, Match, MatchResult, Stage, Team, WorldCupData } from './types'
import rawData from '@/data/worldcup-2026.json'

const data = rawData as unknown as WorldCupData

export function loadData(): WorldCupData {
  return data
}

// Toggle for fabricating match results locally. Off by default — production
// only ever shows real results unless WC_MOCK_RESULTS is explicitly "true".
export function mockResultsEnabled(): boolean {
  return process.env.WC_MOCK_RESULTS === 'true'
}

// Stable pseudo-random in [0, mod) seeded by a match id, so the same fixture
// always resolves the same way across reloads.
function idHash(id: string, mod: number): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h) % mod
}

const KO_ORDER: Stage[] = ['r32', 'r16', 'qf', 'sf', 'final']

// Deterministically simulate an entire tournament so every result-dependent view
// (accuracy badge, ✓/✗, group winners, AND the full knockout bracket) can be
// styled before a single real match is played. Group matches get a home/draw/away
// result; the knockout slots — which are placeholders until the group stage ends —
// are filled by seeding r32 from the group teams and advancing winners round by
// round. Same data in → same bracket out.
export function applyMockResults(d: WorldCupData): WorldCupData {
  const groupResult = (m: Match): MatchResult => {
    const r = idHash(m.id, 3)
    return r === 0 ? 'home' : r === 1 ? 'draw' : 'away'
  }
  const koResult = (id: string): MatchResult => (idHash(id, 2) === 0 ? 'home' : 'away')

  // Fresh shallow copies so we never mutate the imported JSON.
  const matches = d.matches.map((m) => ({ ...m }))
  const stageMatches = (stage: Stage): Match[] =>
    matches.filter((m) => m.stage === stage).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))

  // 1. Group stage results.
  for (const m of matches) {
    if (m.stage === 'group' && !isPlaceholder(m)) m.result = groupResult(m)
  }

  // 2. Team pool: every distinct country that appears in the group stage.
  const pool: Team[] = []
  const seen = new Set<string>()
  for (const m of matches) {
    if (m.stage !== 'group') continue
    for (const t of [m.home, m.away]) {
      if (t.code && !seen.has(t.code)) {
        seen.add(t.code)
        pool.push({ code: t.code, name: t.name, placeholder: null })
      }
    }
  }
  if (pool.length === 0) return { ...d, matches }

  const winner = (m: Match): Team => (m.result === 'away' ? m.away : m.home)
  const loser = (m: Match): Team => (m.result === 'away' ? m.home : m.away)

  // 3. Seed the round of 32 from the pool, then play it out.
  const r32 = stageMatches('r32')
  r32.forEach((m, i) => {
    m.home = pool[(i * 2) % pool.length]
    m.away = pool[(i * 2 + 1) % pool.length]
    m.result = koResult(m.id)
  })

  // 4. Advance winners through each subsequent round (slot s fed by 2s & 2s+1).
  for (let r = 1; r < KO_ORDER.length; r++) {
    const prev = stageMatches(KO_ORDER[r - 1])
    stageMatches(KO_ORDER[r]).forEach((m, i) => {
      if (prev[2 * i] && prev[2 * i + 1]) {
        m.home = winner(prev[2 * i])
        m.away = winner(prev[2 * i + 1])
        m.result = koResult(m.id)
      }
    })
  }

  // 5. Third-place playoff: the two semi-final losers.
  const sf = stageMatches('sf')
  const third = matches.find((m) => m.stage === 'third')
  if (third && sf.length >= 2) {
    third.home = loser(sf[0])
    third.away = loser(sf[1])
    third.result = koResult(third.id)
  }

  return { ...d, matches }
}

// Data for the read-only result views (dashboard, share). Returns mocked
// results when WC_MOCK_RESULTS is on; otherwise the real fixtures untouched.
export function loadDisplayData(): WorldCupData {
  return mockResultsEnabled() ? applyMockResults(data) : data
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
