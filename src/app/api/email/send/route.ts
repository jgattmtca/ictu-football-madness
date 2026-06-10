import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendAllStandingsEmails } from '@/lib/email'
import { LeaderboardEntry } from '@/types'

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const competitionId = req.nextUrl.searchParams.get('competitionId')
  if (!competitionId) return NextResponse.json({ error: 'competitionId required' }, { status: 400 })

  // Build leaderboard
  const { data: competition } = await supabaseAdmin
    .from('competitions')
    .select('name')
    .eq('id', competitionId)
    .single()

  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('competition_id', competitionId)
    .not('email', 'is', null)

  const { data: scores } = await supabaseAdmin
    .from('scores')
    .select('*')
    .eq('competition_id', competitionId)
    .order('total_points', { ascending: false })

  const { data: specials } = await supabaseAdmin
    .from('special_predictions')
    .select('*')
    .eq('competition_id', competitionId)

  if (!participants || !competition) {
    return NextResponse.json({ error: 'Competition or participants not found' }, { status: 404 })
  }

  const participantMap = new Map((participants || []).map(p => [p.id, p]))
  const specialMap = new Map((specials || []).map(s => [s.participant_id, s]))

  const leaderboard: LeaderboardEntry[] = (scores || []).map((score, index) => ({
    rank: index + 1,
    participant: participantMap.get(score.participant_id)!,
    score,
    special: specialMap.get(score.participant_id) || null,
  })).filter(e => e.participant?.email)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ictu-football-madness.vercel.app'

  try {
    const results = await sendAllStandingsEmails(leaderboard, competition.name, appUrl)
    return NextResponse.json({ sent: results.filter(r => r.status === 'sent').length, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
