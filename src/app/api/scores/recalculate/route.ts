import { NextRequest, NextResponse } from 'next/server'
import { recalculateScores } from '@/lib/scores'
import { syncMatchResults } from '@/lib/football-api'

function isAuthed(req: NextRequest) {
  const adminAuth = req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
  const coadminAuth = req.cookies.get('coadmin_auth')?.value === process.env.COADMIN_PASSWORD
  return adminAuth || coadminAuth
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const competitionId = req.nextUrl.searchParams.get('competitionId')
  if (!competitionId) return NextResponse.json({ error: 'competitionId required' }, { status: 400 })

  try {
    // Step 1 — Fetch latest results from football-data.org
    await syncMatchResults(competitionId)

    // Step 2 — Recalculate everyone's points
    await recalculateScores(competitionId)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}