import { supabaseAdmin } from './supabase'

export async function recalculateScores(competitionId: string) {
  await supabaseAdmin
    .from('scores')
    .update({
      total_points: 0,
      exact_scores: 0,
      correct_results: 0,
      accuracy_pct: 0,
      last_updated: new Date().toISOString(),
    })
    .eq('competition_id', competitionId)

  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('id, home_score, away_score')
    .eq('competition_id', competitionId)
    .eq('status', 'finished')

  if (!matches || matches.length === 0) return

  const matchIds = matches.map((m: any) => m.id)
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('participant_id, match_id, home_score, away_score')
    .in('match_id', matchIds)
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)

  if (!predictions || predictions.length === 0) return

  const matchMap = new Map(matches.map((m: any) => [m.id, m]))

  const participantScores = new Map<string, {
    total_points: number
    exact_scores: number
    correct_results: number
    scored_matches: number
  }>()

  for (const pred of predictions) {
    const match = matchMap.get(pred.match_id) as any
    if (!match) continue

    const existing = participantScores.get(pred.participant_id) ?? {
      total_points: 0,
      exact_scores: 0,
      correct_results: 0,
      scored_matches: 0,
    }

    existing.scored_matches++

    const exactMatch =
      pred.home_score === match.home_score &&
      pred.away_score === match.away_score

    const correctResult =
      Math.sign(pred.home_score - pred.away_score) ===
      Math.sign(match.home_score - match.away_score)

    if (exactMatch) {
      existing.total_points += 5
      existing.exact_scores++
    } else if (correctResult) {
      existing.total_points += 3
      existing.correct_results++
    }

    participantScores.set(pred.participant_id, existing)
  }

  for (const [participantId, score] of Array.from(participantScores.entries())) {
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
}