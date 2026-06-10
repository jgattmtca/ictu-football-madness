import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://free-api-live-football-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com',
}

const WC_LEAGUE_ID = 77
const WC_SEASON = 2026

async function apiFetch(path: string) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: HEADERS,
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'fixtures'

  if (type === 'fixtures') {
    const data = await apiFetch(
      `/fixtures-by-league-and-season?leagueid=${WC_LEAGUE_ID}&season=${WC_SEASON}`
    )
    return NextResponse.json({ data: data?.response ?? data?.fixtures ?? [] })
  }

  if (type === 'standings') {
    const data = await apiFetch(
      `/standings-by-league-and-season?leagueid=${WC_LEAGUE_ID}&season=${WC_SEASON}`
    )
    return NextResponse.json({ data: data?.response ?? data?.standings ?? [] })
  }

  if (type === 'topscorers') {
    const data = await apiFetch(
      `/topscorers-by-league-and-season?leagueid=${WC_LEAGUE_ID}&season=${WC_SEASON}`
    )
    return NextResponse.json({ data: data?.response ?? data?.topscorers ?? [] })
  }

  if (type === 'live') {
    const data = await apiFetch(
      `/fixtures-live-by-league?leagueid=${WC_LEAGUE_ID}`
    )
    return NextResponse.json({ data: data?.response ?? data?.fixtures ?? [] })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}