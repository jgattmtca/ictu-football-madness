import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseParticipantExcel, avatarColor, initials } from '@/lib/excel-parser'

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const competitionId = formData.get('competitionId') as string

  if (!file || !competitionId) {
    return NextResponse.json({ error: 'File and competitionId required' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const parsed = parseParticipantExcel(buffer, file.name)

  // Upsert participant
  const participantInitials = initials(parsed.participantName)
  const participantColor = avatarColor(parsed.participantName)

  const { data: existingParticipant } = await supabaseAdmin
    .from('participants')
    .select('id')
    .eq('competition_id', competitionId)
    .ilike('name', parsed.participantName)
    .maybeSingle()

  let participantId: string

  if (existingParticipant) {
    participantId = existingParticipant.id
  } else {
    const { data: newParticipant, error } = await supabaseAdmin
      .from('participants')
      .insert({
        competition_id: competitionId,
        name: parsed.participantName,
        avatar_initials: participantInitials,
        avatar_color: participantColor,
      })
      .select('id')
      .single()

    if (error || !newParticipant) {
      return NextResponse.json({ error: error?.message || 'Failed to create participant' }, { status: 500 })
    }
    participantId = newParticipant.id
  }

  // Fetch all matches for this competition
  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('id, home_team, away_team')
    .eq('competition_id', competitionId)

  let predictionsImported = 0

  if (matches && matches.length > 0) {
    for (const pred of parsed.matchPredictions) {
      // Find matching match by team names (case-insensitive)
      const match = matches.find(m =>
        m.home_team.toLowerCase().trim() === pred.homeTeam.toLowerCase().trim() &&
        m.away_team.toLowerCase().trim() === pred.awayTeam.toLowerCase().trim()
      )
      if (!match) continue

      // Upsert prediction
      const { error } = await supabaseAdmin
        .from('predictions')
        .upsert({
          competition_id: competitionId,
          participant_id: participantId,
          match_id: match.id,
          home_score: pred.homeScore,
          away_score: pred.awayScore,
        }, { onConflict: 'participant_id,match_id' })

      if (!error) predictionsImported++
    }
  } else {
    // If no matches exist yet, create them from the Excel file
    for (const pred of parsed.matchPredictions) {
      const { data: newMatch, error: matchError } = await supabaseAdmin
        .from('matches')
        .insert({
          competition_id: competitionId,
          home_team: pred.homeTeam,
          away_team: pred.awayTeam,
          stage: 'group',
        })
        .select('id')
        .single()

      if (matchError || !newMatch) continue

      const { error: predError } = await supabaseAdmin
        .from('predictions')
        .upsert({
          competition_id: competitionId,
          participant_id: participantId,
          match_id: newMatch.id,
          home_score: pred.homeScore,
          away_score: pred.awayScore,
        }, { onConflict: 'participant_id,match_id' })

      if (!predError) predictionsImported++
    }
  }

  // Upsert special predictions
  if (parsed.tournamentWinner || parsed.goldenBoot) {
    await supabaseAdmin
      .from('special_predictions')
      .upsert({
        competition_id: competitionId,
        participant_id: participantId,
        tournament_winner: parsed.tournamentWinner,
        golden_boot_player: parsed.goldenBoot,
      }, { onConflict: 'participant_id,competition_id' })
  }

  // Initialise score row for this participant
  await supabaseAdmin
    .from('scores')
    .upsert({
      competition_id: competitionId,
      participant_id: participantId,
      total_points: 0,
      exact_scores: 0,
      correct_results: 0,
      accuracy_pct: 0,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'participant_id,competition_id' })

  return NextResponse.json({
    participant: parsed.participantName,
    predictionsImported,
    tournamentWinner: parsed.tournamentWinner,
    goldenBoot: parsed.goldenBoot,
  })
}
