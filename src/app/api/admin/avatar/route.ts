import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const participantId = formData.get('participantId') as string

  if (!file || !participantId) {
    return NextResponse.json({ error: 'File and participantId required' }, { status: 400 })
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `avatars/${participantId}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  // Upload to Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('avatars')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('avatars')
    .getPublicUrl(path)

  // Update participant record
  await supabaseAdmin
    .from('participants')
    .update({ avatar_url: publicUrl })
    .eq('id', participantId)

  return NextResponse.json({ avatarUrl: publicUrl })
}
