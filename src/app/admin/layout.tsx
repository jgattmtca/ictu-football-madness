import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const isAuthed = cookieStore.get('admin_auth')?.value === process.env.ADMIN_PASSWORD

  // Admin login page is at /admin/login — don't redirect that
  // (we handle it by rendering children for the login route)

  return (
    <div className="min-h-screen admin-body">
      {isAuthed && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-bold text-green-700 flex items-center gap-2">
                <span>⚽</span> Admin
              </Link>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Link href="/admin/competitions" className="hover:text-green-600 transition-colors">Competitions</Link>
                <Link href="/admin/upload" className="hover:text-green-600 transition-colors">Upload predictions</Link>
                <Link href="/admin/participants" className="hover:text-green-600 transition-colors">Participants</Link>
              </div>
            </div>
            <form action="/api/admin/logout" method="POST">
              <button className="text-xs text-gray-400 hover:text-gray-600">Sign out</button>
            </form>
          </div>
        </nav>
      )}
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
