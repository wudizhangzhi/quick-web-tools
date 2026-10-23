// Paper Desk config: everything the editor panel can change, plus defaults and
// a sanitizer shared by the browser (localStorage drafts) and the create API.
// Keep this file free of DOM imports — it runs server-side too.

export type PaperStyle = 'plain' | 'lined' | 'grid' | 'kraft' | 'vintage'
export type FontKey = 'hand' | 'brush' | 'serif' | 'sans'
export type DeskKey = 'oak' | 'walnut' | 'white'
export type Align = 'left' | 'center'

export interface TextStyle {
  font: FontKey
  color: string // #rrggbb
}

export interface PaperConfig {
  title: string
  body: string
  signature: string
  date: string
  titleStyle: TextStyle
  bodyStyle: TextStyle
  signStyle: TextStyle // also used for the date
  titleAlign: Align
  style: PaperStyle
  desk: DeskKey
  fontScale: number // 0.7 – 1.4, multiplies body/title size
  stamp: boolean // recipient gets a "批准" button that stamps the paper
  stampText: string
}

export interface PaperStyleDef {
  label: string
  base: string // paper fill
  fiber: string // rgb triple for fibre speckles
  line?: string // ruled / grid line colour
}

export const PAPER_STYLES: Record<PaperStyle, PaperStyleDef> = {
  plain: { label: '白纸', base: '#fbfaf6', fiber: '120,110,90' },
  lined: { label: '横线', base: '#fdfcf7', fiber: '120,110,90', line: 'rgba(70,120,190,.28)' },
  grid: { label: '方格', base: '#fcfcf8', fiber: '120,110,90', line: 'rgba(70,140,160,.22)' },
  kraft: { label: '牛皮纸', base: '#d2b48a', fiber: '90,60,30' },
  vintage: { label: '旧信纸', base: '#efe2c4', fiber: '110,80,40', line: 'rgba(140,90,50,.22)' },
}

// A4, in world units (1 unit ≈ 10cm)
export const PAPER_W = 2.1
export const PAPER_H = 2.97

export const FONTS: Record<FontKey, { label: string; family: string; weight: number }> = {
  hand: { label: '手写', family: '"Long Cang", "Caveat", cursive', weight: 400 },
  brush: { label: '毛笔', family: '"Ma Shan Zheng", "Caveat", cursive', weight: 400 },
  serif: { label: '宋体', family: '"Noto Serif SC", "Songti SC", serif', weight: 500 },
  sans: { label: '黑体', family: '"Noto Sans SC", "PingFang SC", sans-serif', weight: 500 },
}

export const INK_PRESETS: { label: string; color: string }[] = [
  { label: '墨黑', color: '#1d1f24' },
  { label: '钢笔蓝', color: '#1f3f99' },
  { label: '朱红', color: '#b3261e' },
  { label: '铅笔灰', color: '#55575c' },
  { label: '墨绿', color: '#1f5c45' },
  { label: '玫瑰', color: '#c2185b' },
]

export const DESKS: Record<DeskKey, { label: string; base: string; grain: string }> = {
  oak: { label: '橡木', base: '#b9844e', grain: '120,72,30' },
  walnut: { label: '胡桃木', base: '#6e4528', grain: '40,22,10' },
  white: { label: '白桌', base: '#e9e6e0', grain: '150,140,125' },
}

export const DEFAULT_CONFIG: PaperConfig = {
  title: '约会申请书',
  body: [
    '亲爱的老婆大人：',
    '',
    '　　本人近来忙于工作，陪伴不足，深感惭愧。为弥补过失、增进感情，特向您郑重申请：今晚七点共进晚餐，饭后散步，再一起看一场电影。',
    '',
    '　　申请期间，本人郑重承诺：',
    '　　一、全程手机静音，不回工作消息；',
    '　　二、负责订位、买单、拎包、拍照，保证把您拍得好看；',
    '　　三、您说"随便"时，绝不点您不爱吃的。',
    '',
    '　　以上申请，恳请老婆大人批准。',
  ].join('\n'),
  signature: '申请人：老公',
  date: '',
  titleStyle: { font: 'serif', color: '#1d1f24' },
  bodyStyle: { font: 'hand', color: '#1f3f99' },
  signStyle: { font: 'hand', color: '#1f3f99' },
  titleAlign: 'center',
  style: 'plain',
  desk: 'oak',
  fontScale: 1,
  stamp: true,
  stampText: '已批准',
}

export const LIMITS = { title: 40, body: 1000, signature: 40, date: 30, stampText: 6 } as const

const HEX = /^#[0-9a-f]{6}$/i

function pick<T extends string>(v: unknown, allowed: Record<T, unknown>, fallback: T): T {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(allowed, v) ? (v as T) : fallback
}

function str(v: unknown, max: number, fallback: string): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback
}

function textStyle(v: unknown, fallback: TextStyle): TextStyle {
  const r = v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  return {
    font: pick(r.font, FONTS, fallback.font),
    color: typeof r.color === 'string' && HEX.test(r.color) ? r.color.toLowerCase() : fallback.color,
  }
}

export function sanitizeConfig(raw: unknown): PaperConfig {
  const d = DEFAULT_CONFIG
  if (!raw || typeof raw !== 'object') return { ...d }
  const r = raw as Record<string, unknown>
  const scale = typeof r.fontScale === 'number' && Number.isFinite(r.fontScale) ? r.fontScale : d.fontScale
  const stampText = str(r.stampText, LIMITS.stampText, d.stampText).trim()
  return {
    title: str(r.title, LIMITS.title, d.title),
    body: str(r.body, LIMITS.body, d.body),
    signature: str(r.signature, LIMITS.signature, d.signature),
    date: str(r.date, LIMITS.date, d.date),
    titleStyle: textStyle(r.titleStyle, d.titleStyle),
    bodyStyle: textStyle(r.bodyStyle, d.bodyStyle),
    signStyle: textStyle(r.signStyle, d.signStyle),
    titleAlign: pick(r.titleAlign, { left: 1, center: 1 }, d.titleAlign),
    style: pick(r.style, PAPER_STYLES, d.style),
    desk: pick(r.desk, DESKS, d.desk),
    fontScale: Math.min(1.4, Math.max(0.7, scale)),
    stamp: typeof r.stamp === 'boolean' ? r.stamp : d.stamp,
    stampText: stampText || d.stampText,
  }
}

export function isBlank(cfg: PaperConfig): boolean {
  return !cfg.title.trim() && !cfg.body.trim() && !cfg.signature.trim()
}

export function formatDate(d: Date): string {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}
