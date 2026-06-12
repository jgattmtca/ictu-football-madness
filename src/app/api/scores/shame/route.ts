import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const competitionId = req.nextUrl.searchParams.get('competitionId')
  if (!competitionId) return NextResponse.json({ error: 'competitionId required' }, { status: 400 })

  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('status', 'finished')
    .order('match_date', { ascending: true })

  if (!matches || matches.length === 0) {
    return NextResponse.json({ howler: null, coldStreak: null, funStats: [] })
  }

  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('*')
    .eq('competition_id', competitionId)

  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('competition_id', competitionId)

  if (!predictions || !participants) {
    return NextResponse.json({ howler: null, coldStreak: null, funStats: [] })
  }

  const participantMap = new Map(participants.map(p => [p.id, p]))
  const matchMap = new Map(matches.map(m => [m.id, m]))

  // ── Cumulative shame score per participant ──────────────────────────────────
  const shameScores = new Map<string, {
    totalShame: number
    worstMatch: any
    worstShame: number
    participant: any
  }>()

  for (const pred of predictions) {
    const match = matchMap.get(pred.match_id)
    if (!match || match.home_score === null || match.away_score === null) continue
    if (pred.home_score === null || pred.away_score === null) continue

    const participant = participantMap.get(pred.participant_id)
    if (!participant) continue

    const shameScore =
      Math.abs(pred.home_score - match.home_score) +
      Math.abs(pred.away_score - match.away_score)

    const wrongResult = Math.sign(pred.home_score - pred.away_score) !== Math.sign(match.home_score - match.away_score) ? 2 : 0
    const totalShame = shameScore + wrongResult

    const existing = shameScores.get(pred.participant_id) ?? {
      totalShame: 0,
      worstMatch: null,
      worstShame: 0,
      participant,
    }

    existing.totalShame += totalShame

    // Track their single worst prediction too (for display)
    if (totalShame > existing.worstShame) {
      existing.worstShame = totalShame
      existing.worstMatch = {
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        predictedHome: pred.home_score,
        predictedAway: pred.away_score,
        actualHome: match.home_score,
        actualAway: match.away_score,
      }
    }

    shameScores.set(pred.participant_id, existing)
  }

 // Find top 3 cumulative shame scores
  const shameList = Array.from(shameScores.entries())
    .map(([, data]) => ({
      participant: data.participant,
      ...data.worstMatch,
      shameScore: data.totalShame,
    }))
    .sort((a, b) => b.shameScore - a.shameScore)
    .slice(0, 3)

  const howler = shameList[0] ?? null
  const shameTop3 = shameList

  // ── Cold streak ─────────────────────────────────────────────────────────────
  let worstStreak = 0
  let coldStreakParticipant = null

  for (const participant of participants) {
    const myPreds = predictions.filter(p => p.participant_id === participant.id)
    let streak = 0
    for (const match of [...matches].reverse()) {
      const pred = myPreds.find(p => p.match_id === match.id)
      if (!pred || pred.home_score === null || pred.away_score === null) continue
      const predResult = Math.sign(pred.home_score - pred.away_score)
      const actualResult = Math.sign(match.home_score - match.away_score)
      const exactMatch = pred.home_score === match.home_score && pred.away_score === match.away_score
      if (exactMatch || predResult === actualResult) break
      streak++
    }
    if (streak > worstStreak) {
      worstStreak = streak
      coldStreakParticipant = participant
    }
  }

  return NextResponse.json({
    howler,
    shameTop3,
    coldStreak: coldStreakParticipant
      ? { participant: coldStreakParticipant, matchesWithoutPoints: worstStreak }
      : null,
  })
}