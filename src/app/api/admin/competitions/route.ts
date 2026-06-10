import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  const { data: competitions } = await supabaseAdmin
    .from('competitions')
    .select('*')
    .order('created_at', { ascending: false })
  return NextResponse.json({ competitions: competitions || [] })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, slug, start_date, end_date, scoring } = body

  if (!name || !slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('competitions')
    .insert({ name, slug, start_date, end_date, scoring, sport: 'football' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ competition: data })
}
