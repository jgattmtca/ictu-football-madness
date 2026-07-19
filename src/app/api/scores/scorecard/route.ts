import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const STAGE_ORDER: Record<string, number> = {
  final: 6,
  sf: 5,
  qf: 4,
  r16: 3,
  r32: 2,
  group: 1,
}

export async function GET(req: NextRequest) {
  const participantId = req.nextUrl.searchParams.get('participantId')
  const competitionId = req.nextUrl.searchParams.get('competitionId')

  if (!participantId || !competitionId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score, match_date, stage, api_match_id')
    .eq('competition_id', competitionId)
    .eq('status', 'finished')

  if (!matches || matches.length === 0) {
    return NextResponse.json({ scorecard: [] })
  }

  // Sort: stage desc → api_match_id desc → match_date desc
  const sortedMatches = [...matches].sort((a, b) => {
    const stageA = STAGE_ORDER[a.stage] ?? 0
    const stageB = STAGE_ORDER[b.stage] ?? 0
    if (stageB !== stageA) return stageB - stageA

    // Within same stage, sort by api_match_id desc
    if (a.api_match_id && b.api_match_id) {
      return b.api_match_id - a.api_match_id
    }
    if (a.api_match_id) return -1
    if (b.api_match_id) return 1

    // Fall back to match_date desc
    if (a.match_date && b.match_date) {
      return new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
    }
    if (a.match_date) return -1
    if (b.match_date) return 1

    return 0
  })

  const matchIds = sortedMatches.map(m => m.id)

  const { data: predictions } = await supabase
    .from('predictions')
    .select('match_id, home_score, away_score')
    .eq('participant_id', participantId)
    .in('match_id', matchIds)

  const predMap = new Map((predictions || []).map(p => [p.match_id, p]))

  const scorecard = sortedMatches.map(match => {
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
      stage: match.stage,
      actualHome,
      actualAway,
      predHome,
      predAway,
      points,
      result,
    }
  })
// Append bonus rows if competition has ended
  const { data: comp } = await supabase
    .from('competitions')
    .select('actual_winner, actual_golden_boot')
    .eq('id', competitionId)
    .single()

  const { data: special } = await supabase
    .from('special_predictions')
    .select('tournament_winner, golden_boot_player')
    .eq('participant_id', participantId)
    .eq('competition_id', competitionId)
    .single()

  if (comp?.actual_winner) {
    const correct = special?.tournament_winner?.toLowerCase() === comp.actual_winner.toLowerCase()
    scorecard.unshift({
      homeTeam: '🏆 Tournament Winner',
      awayTeam: '',
      stage: 'bonus',
      actualHome: null,
      actualAway: null,
      predHome: null,
      predAway: null,
      points: correct ? 10 : 0,
      result: correct ? 'exact' : 'miss',
      bonusLabel: special?.tournament_winner ?? '—',
      bonusActual: comp.actual_winner,
    } as any)
  }

  if (comp?.actual_golden_boot) {
    const correct = special?.golden_boot_player?.toLowerCase() === comp.actual_golden_boot.toLowerCase()
    scorecard.unshift({
      homeTeam: '👟 Golden Boot',
      awayTeam: '',
      stage: 'bonus',
      actualHome: null,
      actualAway: null,
      predHome: null,
      predAway: null,
      points: correct ? 10 : 0,
      result: correct ? 'exact' : 'miss',
      bonusLabel: special?.golden_boot_player ?? '—',
      bonusActual: comp.actual_golden_boot,
    } as any)
  }

  return NextResponse.json({ scorecard })
 
}