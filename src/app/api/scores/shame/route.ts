import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const competitionId = req.nextUrl.searchParams.get('competitionId')
  if (!competitionId) return NextResponse.json({ error: 'competitionId required' }, { status: 400 })

  // Get all finished matches
  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('status', 'finished')
    .order('match_date', { ascending: true })

  if (!matches || matches.length === 0) {
    return NextResponse.json({ howler: null, coldStreak: null, funStats: [] })
  }

  // Get all predictions
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('*')
    .eq('competition_id', competitionId)

  // Get participants
  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('competition_id', competitionId)

  if (!predictions || !participants) {
    return NextResponse.json({ howler: null, coldStreak: null, funStats: [] })
  }

  const participantMap = new Map(participants.map(p => [p.id, p]))
  const matchMap = new Map(matches.map(m => [m.id, m]))

  // ── Find the Howler ─────────────────────────────────────────────────────────
  // Worst prediction = largest combined goal difference between prediction and actual
  let worstShameScore = 0
  let howler = null

  for (const pred of predictions) {
    const match = matchMap.get(pred.match_id)
    if (!match || match.home_score === null || match.away_score === null) continue
    if (pred.home_score === null || pred.away_score === null) continue

    const participant = participantMap.get(pred.participant_id)
    if (!participant) continue

    // Shame score = how wrong they were (total goal difference combined)
    const shameScore =
      Math.abs(pred.home_score - match.home_score) +
      Math.abs(pred.away_score - match.away_score)

    // Bonus shame: predicted wrong winner by a huge margin
    const predictedResult = Math.sign(pred.home_score - pred.away_score)
    const actualResult = Math.sign(match.home_score - match.away_score)
    const wrongResult = predictedResult !== actualResult ? 2 : 0

    const totalShame = shameScore + wrongResult

    if (totalShame > worstShameScore) {
      worstShameScore = totalShame
      howler = {
        participant,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        predictedHome: pred.home_score,
        predictedAway: pred.away_score,
        actualHome: match.home_score,
        actualAway: match.away_score,
        shameScore: totalShame,
      }
    }
  }

  // ── Find the Cold Streak ─────────────────────────────────────────────────────
  // Who has gone the most consecutive finished matches without scoring any points
  let worstStreak = 0
  let coldStreakParticipant = null

  for (const participant of participants) {
    const myPreds = predictions.filter(p => p.participant_id === participant.id)

    // Go through matches in order, count consecutive blanks from most recent
    let streak = 0
    for (const match of [...matches].reverse()) {
      const pred = myPreds.find(p => p.match_id === match.id)
      if (!pred || pred.home_score === null || pred.away_score === null) continue

      const predResult = Math.sign(pred.home_score - pred.away_score)
      const actualResult = Math.sign(match.home_score - match.away_score)
      const exactMatch = pred.home_score === match.home_score && pred.away_score === match.away_score

      if (exactMatch || predResult === actualResult) {
        break // Ended the streak
      }
      streak++
    }

    if (streak > worstStreak) {
      worstStreak = streak
      coldStreakParticipant = participant
    }
  }

  return NextResponse.json({
    howler,
    coldStreak: coldStreakParticipant
      ? { participant: coldStreakParticipant, matchesWithoutPoints: worstStreak }
      : null,
  })
}
