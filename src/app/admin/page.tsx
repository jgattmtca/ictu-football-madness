import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
  const cookieStore = cookies()
  const isAuthed = cookieStore.get('admin_auth')?.value === process.env.ADMIN_PASSWORD
  if (!isAuthed) redirect('/admin/login')

  const { data: competitions } = await supabase
    .from('competitions')
    .select('*, participants(count), matches(count)')
    .order('created_at', { ascending: false })

  return <AdminDashboard competitions={competitions || []} />
}