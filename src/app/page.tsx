import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'

export const revalidate = 60

export default async function HomePage() {
  const { data: competitions } = await supabase
    .from('competitions')
    .select('*')
    .order('created_at', { ascending: false })

  const active = competitions?.find(c => c.is_active)

  return (
    <main className="min-h-screen pitch-bg flex flex-col items-center justify-center p-6">
      {/* Logo / Title */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">⚽</div>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          ICTU Football Madness
        </h1>
        <p className="text-green-300 mt-2 text-lg">The ultimate prediction competition</p>
      </div>

      {/* Competitions */}
      <div className="w-full max-w-lg space-y-3">
        {competitions && competitions.length > 0 ? (
          competitions.map((comp: Competition) => (
            <Link
              key={comp.id}
              href={`/dashboard/${comp.slug}`}
              className={`block w-full rounded-2xl p-5 border transition-all hover:scale-[1.02] ${
                comp.is_active
                  ? 'bg-green-800/60 border-green-500/50 hover:border-green-400'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <span className="text-white font-semibold text-lg">{comp.name}</span>
                    {comp.is_active && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                        Live
                      </span>
                    )}
                  </div>
                  {comp.start_date && (
                    <p className="text-green-300/70 text-sm mt-1 ml-7">
                      {new Date(comp.start_date).getFullYear()}
                    </p>
                  )}
                </div>
                <span className="text-green-400 text-xl">→</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center text-green-300/60 py-12">
            <p className="text-5xl mb-4">🏟️</p>
            <p>No competitions yet.</p>
            <p className="text-sm mt-1">Ask your admin to set one up!</p>
          </div>
        )}
      </div>

      {/* Admin link */}
      <div className="mt-12">
        <Link
          href="/admin"
          className="text-green-600/60 hover:text-green-500 text-sm transition-colors"
        >
          Admin panel
        </Link>
      </div>
    </main>
  )
}
