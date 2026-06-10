import { supabaseAdmin } from './supabase'

const API_KEY = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://free-api-live-football-data.p.rapidapi.com'

// League IDs for Free API Live Football Data (by Smart API on RapidAPI)
// World Cup = 77, Euros = 9, Champions League = 2
const LEAGUE_IDS: Record<string, number> = {
  wc: 77,
  euros: 9,
  ucl: 2,
}

async function apiFetch(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com',
    },
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Football API error: ${res.status}`)
  return res.json()
}

/**
 * Syncs live/finished match results for a competition.
 * Called by the /api/sync/scores route (cron job every 5 min).
 */
export async function syncMatchResults(competitionId: string) {
  const { data: comp } = await supabaseAdmin
    .from('competitions')
    .select('slug, start_date, end_date')
    .eq('id', competitionId)
    .single()

  if (!comp) throw new Error('Competition not found')

  // Determine league ID from slug prefix
  const slugPrefix = comp.slug.replace(/\d+/g, '').toLowerCase()
  const leagueId = LEAGUE_IDS[slugPrefix] ?? 77
  const season = new Date(comp.start_date || Date.now()).getFullYear()

  // Fetch today's fixtures
  const today = new Date().toISOString().split('T')[0]
  const data = await apiFetch(`/fixtures-by-date-and-league-and-season?leagueid=${leagueId}&date=${today}&season=${season}`)

  // Smart API response format: data.response is an array of fixtures
  const fixtures = data?.response ?? data?.fixtures ?? []
  let updated = 0

  for (const fixture of fixtures) {
    // Smart API fixture shape
    const homeTeam = fixture.teams?.home?.name ?? fixture.homeTeam?.name
    const awayTeam = fixture.teams?.away?.name ?? fixture.awayTeam?.name
    const homeGoals = fixture.goals?.home ?? fixture.score?.home ?? null
    const awayGoals = fixture.goals?.away ?? fixture.score?.away ?? null
    const statusShort = fixture.fixture?.status?.short ?? fixture.status?.short ?? fixture.status

    if (!homeTeam || !awayTeam) continue

    // Only process live or finished matches
    const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(statusShort)
    const isLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'P'].includes(statusShort)
    if (!isFinished && !isLive) continue

    // Match against our DB by team name (case-insensitive)
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
      })
      .eq('id', dbMatch.id)

    updated++
  }

  return { updated, total: fixtures.length }
}
