import { ImageResponse } from 'next/og'
import { loadDisplayData } from '@/lib/world-cup/fixtures'
import { computeStats, accuracyTitle } from '@/lib/world-cup/scoring'
import { championPick } from '@/lib/world-cup/champion'
import { featuredMatch } from '@/lib/world-cup/featured'
import { matchLabel } from '@/lib/world-cup/labels'
import { loadPredictionsByCode } from '@/lib/world-cup/share-data'
import { flagUrl } from '@/lib/world-cup/flags'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const alt = '世界杯预测战报'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Fetch a Google font as TTF so Satori (which can't parse woff2) can embed it.
// The old UA makes Google serve truetype; we only request the glyphs we render.
async function loadFont(family: string, text: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(
      text,
    )}`
    const css = await (
      await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1)' } })
    ).text()
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)
    if (!src) return null
    const res = await fetch(src[1])
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

// Every Chinese glyph the poster can render, so the subset request covers them.
const TIER_TITLES =
  '你是穿越来的吧绝世预言家神算子资深球探懂球老炮半仙在世跟着感觉走重在参与偶尔蒙对反向预言家'
const STAGE_TEXT = '小组赛季军战决半强我猜这场平ABCDEFGHIJKL0123456789'
const STATIC_TEXT = `预测战报我的正确率猜对场已揭晓冠军赛果揭晓后见真章扫码也来猜世界杯竞${TIER_TITLES}${STAGE_TEXT}`

// One side of the featured matchup, Satori-flavoured (inline styles + remote
// flag image). The picked side gets an amber border + check and stays opaque.
function ogTeamSide(name: string, flag: string | null, picked: boolean, dimmed: boolean) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {flag && (
        <img
          src={flag}
          width={72}
          height={48}
          alt=""
          style={{ borderRadius: 6, border: picked ? '3px solid #fcd34d' : '3px solid transparent' }}
        />
      )}
      <div
        style={{
          display: 'flex',
          marginTop: 8,
          fontSize: 26,
          fontWeight: 700,
          color: picked ? '#fcd34d' : '#fff',
        }}
      >
        {picked ? `${name} ✓` : name}
      </div>
    </div>
  )
}

export default async function OgImage({ params }: { params: { code: string } }) {
  const predictions = (await loadPredictionsByCode(params.code)) ?? {}
  const data = loadDisplayData()
  const stats = computeStats(predictions, data)
  const champion = championPick(predictions, data)
  const featured = featuredMatch(predictions, data)

  const hasResults = stats.resolved > 0
  const pct = Math.round(stats.accuracy * 100)
  const tier = hasResults ? accuracyTitle(pct) : null

  const text =
    STATIC_TEXT +
    data.title +
    (champion?.name ?? '') +
    (featured ? featured.match.home.name + featured.match.away.name + matchLabel(featured.match) : '')
  const font = await loadFont('Noto+Sans+SC', text, 700)
  const champFlag = champion ? flagUrl(champion.code, 80) : null
  const choice = featured?.choice

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          color: 'white',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #064e3b 55%, #052e16 100%)',
          fontFamily: 'Noto Sans SC, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '6px 18px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
              color: '#fcd34d',
              fontSize: 22,
              letterSpacing: 4,
            }}
          >
            预测战报
          </div>
          <div style={{ display: 'flex', marginTop: 16, fontSize: 56, fontWeight: 700 }}>
            我的{data.title}预测
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {tier ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 96, fontWeight: 700 }}>
                <span style={{ fontSize: 110, marginRight: 24 }}>{tier.emoji}</span>
                {tier.title}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignSelf: 'flex-start',
                  marginTop: 24,
                  padding: '12px 28px',
                  borderRadius: 999,
                  background: 'rgba(251,191,36,0.92)',
                  color: '#052e16',
                  fontSize: 34,
                  fontWeight: 700,
                }}
              >
                正确率 {pct}% · 猜对 {stats.correct}/{stats.resolved}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 96, marginRight: 20 }}>🏆</span>
              <span style={{ fontSize: 48, fontWeight: 700 }}>已猜</span>
              <span style={{ fontSize: 120, fontWeight: 700, color: '#fcd34d', margin: '0 16px' }}>
                {stats.predicted}
              </span>
              <span style={{ fontSize: 48, fontWeight: 700 }}>场</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
            {featured && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '18px 28px',
                  borderRadius: 24,
                  background: 'rgba(255,255,255,0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: 22,
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: 14,
                  }}
                >
                  我猜这场 · {matchLabel(featured.match)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                  {ogTeamSide(
                    featured.match.home.name,
                    flagUrl(featured.match.home.code, 80),
                    choice === 'home',
                    choice === 'away',
                  )}
                  <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                    {choice === 'draw' ? '我猜平' : 'VS'}
                  </div>
                  {ogTeamSide(
                    featured.match.away.name,
                    flagUrl(featured.match.away.code, 80),
                    choice === 'away',
                    choice === 'home',
                  )}
                </div>
              </div>
            )}

            {champion && champFlag && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 22px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ display: 'flex', fontSize: 22, color: 'rgba(255,255,255,0.7)' }}>
                  我的冠军
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={champFlag} width={48} height={32} style={{ borderRadius: 4 }} alt="" />
                <div style={{ display: 'flex', fontSize: 28, fontWeight: 700 }}>{champion.name}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: 26, color: '#fcd34d' }}>
          扫码也来猜 →
        </div>
      </div>
    ),
    {
      ...size,
      emoji: 'twemoji',
      fonts: font ? [{ name: 'Noto Sans SC', data: font, weight: 700, style: 'normal' }] : [],
    },
  )
}
