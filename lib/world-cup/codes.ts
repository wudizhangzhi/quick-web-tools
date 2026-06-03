import { customAlphabet } from 'nanoid'

const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export const SHARE_CODE_LENGTH = 8
const UID_LENGTH = 24

const genShare = customAlphabet(alphabet, SHARE_CODE_LENGTH)
const genUid = customAlphabet(alphabet, UID_LENGTH)

const SHARE_CODE_RE = new RegExp(`^[a-zA-Z0-9]{${SHARE_CODE_LENGTH}}$`)

export function generateShareCode(): string {
  return genShare()
}

export function generateUid(): string {
  return genUid()
}

export function isValidShareCode(s: string): boolean {
  return SHARE_CODE_RE.test(s)
}
