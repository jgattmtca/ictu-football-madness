import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const participantId = req.nextUrl.searchParams.get('participantId')
  const competitionId = req.nextUrl.searchParams.get('competitionId')

  if (!participantId || !competitionId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // Get finished matches only
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score, match_date, api_match_id')
    .eq('competition_id', competitionId)
    .eq('status', 'finished')
    .order('api_match_id', { ascending: false })

  if (!matches || matches.length === 0) {
    return NextResponse.json({ scorecard: [] })
  }

  const matchIds = matches.map(m => m.id)

  // Get this participant's predictions for finished matches only
  const { data: predictions } = await supabase
    .from('predictions')
    .select('match_id, home_score, away_score')
    .eq('participant_id', participantId)
    .in('match_id', matchIds)

  const predMap = new Map((predictions || []).map(p => [p.match_id, p]))

  const scorecard = matches.map(match => {
    const pred = predMap.get(match.id)
    const predHome = pred?.home_score ?? null
    const predAway = pred?.away_score ?? null
    const actualHome = match.home_score
    const actualAway = match.away_score

    let points = 0
    let result = 'miss'

    if (predHome !== null && predAway !== null) {
      if (predHome === actualHome && predAway === actualAway) {
        points = 5
        result = 'exact'
      } else if (Math.sign(predHome - predAway) === Math.sign(actualHome! - actualAway!)) {
        points = 3
        result = 'correct'
      }
    }

    return {
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      actualHome,
      actualAway,
      predHome,
      predAway,
      points,
      result,
    }
  })

  return NextResponse.json({ scorecard })
}