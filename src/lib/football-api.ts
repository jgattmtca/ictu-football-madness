import { supabaseAdmin } from './supabase'

const API_TOKEN = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://api.football-data.org/v4'

async function apiFetch(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_TOKEN },
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Football API error: ${res.status}`)
  return res.json()
}

export async function syncMatchResults(competitionId: string) {
  const { data: comp } = await supabaseAdmin
    .from('competitions')
    .select('slug, start_date, end_date')
    .eq('id', competitionId)
    .single()

  if (!comp) throw new Error('Competition not found')

  // Fetch all WC matches
  const data = await apiFetch('/competitions/WC/matches')
  const matches = data?.matches ?? []

  let updated = 0

  for (const match of matches) {
    const homeTeam = match.homeTeam?.name
    const awayTeam = match.awayTeam?.name
    const homeGoals = match.score?.fullTime?.home ?? null
    const awayGoals = match.score?.fullTime?.away ?? null
    const status = match.status

    if (!homeTeam || !awayTeam) continue

    const isFinished = status === 'FINISHED'
    const isLive = status === 'IN_PLAY' || status === 'PAUSED'

    if (!isFinished && !isLive) continue

    const { data: dbMatch } = await supabaseAdmin
      .from('matches')
      .select('id, status')
      .eq('competition_id', competitionId)
      .ilike('home_team', homeTeam)
      .ilike('away_team', awayTeam)
      .maybeSingle()

    if (!dbMatch) continue
    if (dbMatch.status === 'finished' && isFinished) continue

    await supabaseAdmin
      .from('matches')
      .update({
        home_score: homeGoals,
        away_score: awayGoals,
        status: isFinished ? 'finished' : 'live',
        match_date: match.utcDate ? match.utcDate.split('T')[0] : null,
        api_match_id: match.id ?? null,
      })
      .eq('id', dbMatch.id)

    updated++
  }

  return { updated, total: matches.length }
}