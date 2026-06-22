import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
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
    // Step 1 - Fetch latest results
    await syncMatchResults(competitionId)

    // Step 2 - Reset scores
    await supabaseAdmin
      .from('scores')
      .update({ total_points: 0, exact_scores: 0, correct_results: 0, accuracy_pct: 0 })
      .eq('competition_id', competitionId)

    // Step 3 - Get finished matches
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('id, home_score, away_score')
      .eq('competition_id', competitionId)
      .eq('status', 'finished')

    if (!matches || matches.length === 0) {
      return NextResponse.json({ ok: true, message: 'No finished matches' })
    }

    // Step 4 - Get predictions
    const matchIds = matches.map((m: any) => m.id)
    const { data: predictions } = await supabaseAdmin
      .from('predictions')
      .select('participant_id, match_id, home_score, away_score')
      .in('match_id', matchIds)
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .limit(10000)

    if (!predictions || predictions.length === 0) {
      return NextResponse.json({ ok: true, message: 'No predictions found' })
    }

    // Step 5 - Calculate points
    const matchMap = new Map(matches.map((m: any) => [m.id, m]))
    const scores = new Map<string, any>()

    for (const pred of predictions) {
      const match = matchMap.get(pred.match_id) as any
      if (!match) continue

      const s = scores.get(pred.participant_id) ?? {
        total_points: 0, exact_scores: 0, correct_results: 0, scored_matches: 0
      }
      s.scored_matches++

      const exact = pred.home_score === match.home_score && pred.away_score === match.away_score
      const correct = Math.sign(pred.home_score - pred.away_score) === Math.sign(match.home_score - match.away_score)

      if (exact) { s.total_points += 5; s.exact_scores++ }
      else if (correct) { s.total_points += 3; s.correct_results++ }

      scores.set(pred.participant_id, s)
    }

    // Step 6 - Update scores
    for (const [participantId, score] of Array.from(scores.entries())) {
      const accuracyPct = score.scored_matches > 0
        ? Math.round(((score.exact_scores + score.correct_results) / score.scored_matches) * 100 * 100) / 100
        : 0

      await supabaseAdmin
        .from('scores')
        .update({
          total_points: score.total_points,
          exact_scores: score.exact_scores,
          correct_results: score.correct_results,
          accuracy_pct: accuracyPct,
          last_updated: new Date().toISOString(),
        })
        .eq('competition_id', competitionId)
        .eq('participant_id', participantId)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}