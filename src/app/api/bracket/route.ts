import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const competitionId = req.nextUrl.searchParams.get('competitionId') ?? 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score, status, stage, match_date, match_time')
    .eq('competition_id', competitionId)
    .in('stage', ['r32', 'r16', 'qf', 'sf', 'final'])
    .order('match_date', { ascending: true, nullsFirst: false })

  return NextResponse.json({ matches: matches || [] })
}
