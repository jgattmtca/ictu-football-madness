import { NextRequest, NextResponse } from 'next/server'
import { recalculateScores } from '@/lib/scores'

export async function POST(req: NextRequest) {
  const isAdmin = req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const competitionId = req.nextUrl.searchParams.get('competitionId')
  if (!competitionId) return NextResponse.json({ error: 'competitionId required' }, { status: 400 })

  try {
    await recalculateScores(competitionId)
    return NextResponse.redirect(new URL('/admin', req.url))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}