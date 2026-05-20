export type MemeKind = 'happy' | 'sad'
export type MemeDef = { id: string; label: string; emoji: string; kind: MemeKind }

export const HAPPY_MEMES: MemeDef[] = [
  { id: 'happy_party', label: '欢呼', emoji: '🥳', kind: 'happy' },
  { id: 'happy_confetti', label: '撒花', emoji: '🎉', kind: 'happy' },
  { id: 'happy_thumbs', label: '点赞', emoji: '👍', kind: 'happy' },
  { id: 'happy_dance', label: '蹦迪', emoji: '💃', kind: 'happy' },
  { id: 'happy_bow', label: '鞠躬', emoji: '🙇', kind: 'happy' },
  { id: 'happy_hug', label: '抱抱', emoji: '🤗', kind: 'happy' },
  { id: 'happy_heart', label: '比心', emoji: '🫶', kind: 'happy' },
  { id: 'happy_sparkle', label: '闪闪', emoji: '✨', kind: 'happy' },
]

export const SAD_MEMES: MemeDef[] = [
  { id: 'sad_pleading', label: '可怜巴巴', emoji: '🥺', kind: 'sad' },
  { id: 'sad_disappointed', label: '失望', emoji: '😞', kind: 'sad' },
  { id: 'sad_tear', label: '流泪', emoji: '😢', kind: 'sad' },
  { id: 'sad_cry', label: '大哭', emoji: '😭', kind: 'sad' },
  { id: 'sad_weary', label: '崩溃', emoji: '😩', kind: 'sad' },
  { id: 'sad_pray', label: '求求了', emoji: '🙏', kind: 'sad' },
  { id: 'sad_anger', label: '生气', emoji: '😠', kind: 'sad' },
  { id: 'sad_broken_heart', label: '心碎', emoji: '💔', kind: 'sad' },
]

const HAPPY_IDS = new Set(HAPPY_MEMES.map((m) => m.id))
const SAD_IDS = new Set(SAD_MEMES.map((m) => m.id))

export function isHappyMeme(id: string): boolean {
  return HAPPY_IDS.has(id)
}

export function isSadMeme(id: string): boolean {
  return SAD_IDS.has(id)
}

export function findMeme(id: string): MemeDef | undefined {
  return HAPPY_MEMES.find((m) => m.id === id) ?? SAD_MEMES.find((m) => m.id === id)
}
