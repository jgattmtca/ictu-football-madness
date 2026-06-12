import { supabaseAdmin } from './supabase'
import { calculateMatchPoints } from './excel-parser'
import { ScoringRules } from '@/types'

/**
 * Recalculates all scores for a competition.
 * Called after new results come in or predictions are uploaded.
 */
export async function recalculateScores(competitionId: string) {
  // Fetch competition scoring rules
  const { data: comp } = await supabaseAdmin
    .from('competitions')
    .select('scoring')
    .eq('id', competitionId)
    .single()

  if (!comp) throw new Error('Competition not found')
  const rules: ScoringRules = comp.scoring

  // Fetch all finished matches
  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('status', 'finished')

  // Fetch all participants
  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('competition_id', competitionId)

  // Fetch all predictions
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('*')
    .eq('competition_id', competitionId)

  // Fetch special predictions
  const { data: specials } = await supabaseAdmin
    .from('special_predictions')
    .select('*')
    .eq('competition_id', competitionId)

  if (!participants || !matches || !predictions) return

  // Build match lookup
  const matchMap = new Map((matches || []).map(m => [m.id, m]))

  for (const participant of participants) {
    const myPreds = (predictions || []).filter(p => p.participant_id === participant.id)
    const mySpecial = (specials || []).find(s => s.participant_id === participant.id)

    let totalPoints = 0
    let exactScores = 0
    let correctResults = 0
    let scoredMatches = 0

    for (const pred of myPreds) {
      const match = matchMap.get(pred.match_id)
      if (!match || match.status !== 'finished') continue

      scoredMatches++
      const pts = calculateMatchPoints(
        pred.home_score, pred.away_score,
        match.home_score, match.away_score,
        rules
      )
      totalPoints += pts

      if (pts === rules.exact_score) exactScores++
      else if (pts === rules.correct_result) correctResults++
    }

    // Special predictions bonus
    // Tournament winner — compare against the final match winner once it's done
    // For now we check special_predictions.tournament_winner vs actual winner
    // (This is set manually by admin when competition ends)
    const { data: compData } = await supabaseAdmin
      .from('competitions')
      .select('actual_winner, actual_golden_boot')
      .eq('id', competitionId)
      .single()

    if (compData) {
      if (mySpecial?.tournament_winner && compData.actual_winner &&
          mySpecial.tournament_winner.toLowerCase() === compData.actual_winner.toLowerCase()) {
        totalPoints += rules.tournament_winner
      }
      if (mySpecial?.golden_boot_player && compData.actual_golden_boot &&
          mySpecial.golden_boot_player.toLowerCase() === compData.actual_golden_boot.toLowerCase()) {
        totalPoints += rules.golden_boot
      }
    }

    // Accuracy = (exact + correct) / total scored matches
    const accuracyPct = scoredMatches > 0
      ? Math.round(((exactScores + correctResults) / scoredMatches) * 100 * 100) / 100
      : 0

    // Upsert score
    await supabaseAdmin
      .from('scores')
      .upsert({
        competition_id: competitionId,
        participant_id: participant.id,
        total_points: totalPoints,
        exact_scores: exactScores,
        correct_results: correctResults,
        accuracy_pct: accuracyPct,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'participant_id,competition_id' })
  }
}
