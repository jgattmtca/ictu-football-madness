import { NextRequest, NextResponse } from 'next/server'
import { syncMatchResults } from '@/lib/football-api'
import { recalculateScores } from '@/lib/scores'
import { supabaseAdmin } from '@/lib/supabase'

// This route is called by Vercel Cron every 5 minutes during the competition
// Configure in vercel.json: { "crons": [{ "path": "/api/sync/scores", "schedule": "*/5 * * * *" }] }

export async function GET(req: NextRequest) {
  // Allow cron calls (Vercel sets Authorization header) or admin calls
  const authHeader = req.headers.get('authorization')
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin = req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD

  if (!isVercelCron && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all active competitions
  const { data: competitions } = await supabaseAdmin
    .from('competitions')
    .select('id, name, slug')
    .eq('is_active', true)

  if (!competitions || competitions.length === 0) {
    return NextResponse.json({ message: 'No active competitions' })
  }

  const results = []
  for (const comp of competitions) {
    try {
      const syncResult = await syncMatchResults(comp.id)
      if (syncResult.updated > 0) {
        await recalculateScores(comp.id)
      }
      results.push({ competition: comp.name, ...syncResult })
    } catch (e: any) {
      results.push({ competition: comp.name, error: e.message })
    }
  }

  return NextResponse.json({ synced: results, timestamp: new Date().toISOString() })
}

// Manual trigger from admin
export async function POST(req: NextRequest) {
  const isAdmin = req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { competitionId } = await req.json()

  try {
    const syncResult = await syncMatchResults(competitionId)
    await recalculateScores(competitionId)
    return NextResponse.json({ success: true, ...syncResult })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
