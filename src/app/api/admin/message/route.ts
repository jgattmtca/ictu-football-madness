import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, competitionId } = await req.json()

  await supabaseAdmin
    .from('competitions')
    .update({ commissioner_message: message })
    .eq('id', competitionId)

  return NextResponse.json({ ok: true })
}