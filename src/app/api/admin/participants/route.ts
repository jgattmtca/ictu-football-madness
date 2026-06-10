import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const competitionId = req.nextUrl.searchParams.get('competitionId')
  if (!competitionId) return NextResponse.json({ error: 'competitionId required' }, { status: 400 })

  const { data: participants, error } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('competition_id', competitionId)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ participants: participants || [] })
}
