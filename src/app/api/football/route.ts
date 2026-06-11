import { NextRequest, NextResponse } from 'next/server'

const API_TOKEN = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://api.football-data.org/v4'
const HEADERS = { 'X-Auth-Token': API_TOKEN }

async function apiFetch(path: string) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: HEADERS,
      next: { revalidate: 60 },
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
    const data = await apiFetch('/competitions/WC/matches')
    return NextResponse.json({ data: data?.matches ?? [] })
  }

  if (type === 'standings') {
    const data = await apiFetch('/competitions/WC/standings')
    return NextResponse.json({ data: data?.standings ?? [] })
  }

  if (type === 'topscorers') {
    const data = await apiFetch('/competitions/WC/scorers')
    return NextResponse.json({ data: data?.scorers ?? [] })
  }

  if (type === 'live') {
    const data = await apiFetch('/competitions/WC/matches?status=LIVE')
    return NextResponse.json({ data: data?.matches ?? [] })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}