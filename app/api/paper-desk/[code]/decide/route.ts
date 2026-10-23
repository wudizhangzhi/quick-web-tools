import { NextResponse } from 'next/server'
import { isValidShortCode } from '@/lib/force-yes/codes'
import { decisionOf, getPaper, savePaper, type Decision } from '@/lib/paper-desk/store'

// Approve (stamp) or reject (shred). Idempotent: the first decision wins and is kept.
export async function POST(req: Request, { params }: { params: { code: string } }) {
  if (!isValidShortCode(params.code)) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const body = (await req.json().catch(() => ({}))) as { decision?: string }
  if (body.decision !== 'approved' && body.decision !== 'rejected') {
    return NextResponse.json({ error: 'invalid_decision' }, { status: 400 })
  }
  const paper = await getPaper(params.code)
  if (!paper) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (!paper.cfg.stamp) return NextResponse.json({ error: 'decide_disabled' }, { status: 400 })
  const existing = decisionOf(paper)
  if (existing) return NextResponse.json(existing)
  paper.decision = body.decision as Decision
  paper.decidedAt = Date.now()
  await savePaper(params.code, paper, true)
  return NextResponse.json({ decision: paper.decision, at: paper.decidedAt })
}
