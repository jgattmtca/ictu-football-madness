import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.redirect(new URL('/admin/login', req.url))

  const competitionId = req.nextUrl.searchParams.get('competitionId')
  const clear = req.nextUrl.searchParams.get('clear')

  let message = ''
  if (!clear) {
    const formData = await req.formData()
    message = formData.get('message') as string || ''
  }

  await supabaseAdmin
    .from('competitions')
    .update({ commissioner_message: message })
    .eq('id', competitionId)

  return NextResponse.redirect(new URL('/admin', req.url))
}