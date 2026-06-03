/**
 * Fetch FIFA World Cup fixtures + results from the official calendar API and write
 * them into data/worldcup-2026.json. Run daily during the tournament:
 *
 *   npm run fetch:wc
 *
 * Re-runnable & idempotent: merges by stable match id, so existing ids that users
 * have predicted are never dropped — only results and newly-decided knockout teams
 * change. Next tournament: bump COMPETITION_ID + FROM/TO + OUT and re-run.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { buildMatches, mergeData, type FifaMatch } from '../lib/world-cup/ingest'
import type { WorldCupData } from '../lib/world-cup/types'

const COMPETITION_ID = '17' // FIFA idCompetition for the (men's) World Cup
const FROM = '2026-06-01T00:00:00Z'
const TO = '2026-07-20T00:00:00Z'
const TITLE = '2026 美加墨世界杯'
const OUT = join(process.cwd(), 'data', 'worldcup-2026.json')

const BASE = 'https://api.fifa.com/api/v3/calendar/matches'

async function fetchMatches(language: 'en' | 'zh'): Promise<FifaMatch[]> {
  const url =
    `${BASE}?idCompetition=${COMPETITION_ID}` +
    `&from=${encodeURIComponent(FROM)}&to=${encodeURIComponent(TO)}` +
    `&count=500&language=${language}`

  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(500 * 2 ** attempt) // 1s, 2s backoff
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'quick-web-tools/worldcup' },
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { Results?: FifaMatch[] }
      return json.Results ?? []
    } catch (e) {
      lastErr = e
      console.warn(`[fetch-worldcup] ${language} attempt ${attempt + 1} failed:`, String(e))
    }
  }
  throw new Error(`failed to fetch ${language}: ${String(lastErr)}`)
}

function readExisting(): WorldCupData | null {
  if (!existsSync(OUT)) return null
  try {
    return JSON.parse(readFileSync(OUT, 'utf8')) as WorldCupData
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log('[fetch-worldcup] fetching zh + en …')
  const [zh, en] = await Promise.all([fetchMatches('zh'), fetchMatches('en')])
  console.log(`[fetch-worldcup] zh=${zh.length} en=${en.length} matches`)
  if (zh.length === 0) throw new Error('no matches returned — aborting (refusing to overwrite)')

  const incoming: WorldCupData = {
    competitionId: COMPETITION_ID,
    title: TITLE,
    matches: buildMatches(zh, en),
  }

  const existing = readExisting()
  const merged = mergeData(existing, incoming)

  const resolved = merged.matches.filter((m) => m.result != null).length
  const decided = merged.matches.filter((m) => m.home.placeholder == null && m.away.placeholder == null).length
  console.log(
    `[fetch-worldcup] total=${merged.matches.length} resolved=${resolved} teams-decided=${decided}`,
  )

  if (existing) {
    const prev = new Map(existing.matches.map((m) => [m.id, m.result]))
    const changed = merged.matches.filter((m) => prev.has(m.id) && prev.get(m.id) !== m.result)
    if (changed.length) {
      console.log('[fetch-worldcup] newly resolved/changed:')
      for (const m of changed) {
        console.log(`  ${m.id} ${m.home.name} vs ${m.away.name} -> ${m.result}`)
      }
    }
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  console.log(`[fetch-worldcup] wrote ${OUT}`)
}

main().catch((e) => {
  console.error('[fetch-worldcup] FAILED:', e)
  process.exit(1)
})
