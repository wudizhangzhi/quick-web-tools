import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isValidShortCode } from '@/lib/force-yes/codes'
import { sanitizeConfig } from '@/lib/paper-desk/config'
import { decisionOf, getPaper, type StoredPaper } from '@/lib/paper-desk/store'
import PaperShareClient from './PaperShareClient'

// Always read fresh: a cached page would hide a just-made decision (stamp / shred).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '你收到一张纸',
  description: '有人在桌上给你留了一张纸，快打开看看。',
  robots: { index: false, follow: false },
}

export default async function PaperSharePage({ params }: { params: { code: string } }) {
  if (!isValidShortCode(params.code)) notFound()
  let paper: StoredPaper | null = null
  try {
    paper = await getPaper(params.code)
  } catch {
    paper = null
  }
  if (!paper) notFound()

  return <PaperShareClient code={params.code} cfg={sanitizeConfig(paper.cfg)} initial={decisionOf(paper)} />
}
