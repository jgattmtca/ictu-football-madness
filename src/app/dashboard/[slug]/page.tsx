import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RaceTrack from '@/components/RaceTrack'
import ScoreTable from '@/components/ScoreTable'
import CompetitionHeader from '@/components/CompetitionHeader'
import { LeaderboardEntry } from '@/types'

export const revalidate = 300 // revalidate every 5 min

interface Props { params: { slug: string } }

async function getLeaderboard(slug: string): Promise<{
  competition: any
  leaderboard: LeaderboardEntry[]
}> {
  const { data: competition } = await supabase
    .from('competitions')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!competition) return { competition: null, leaderboard: [] }

  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('competition_id', competition.id)

  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('competition_id', competition.id)
    .order('total_points', { ascending: false })

  const { data: specials } = await supabase
    .from('special_predictions')
    .select('*')
    .eq('competition_id', competition.id)

  const participantMap = new Map((participants || []).map(p => [p.id, p]))
  const specialMap = new Map((specials || []).map(s => [s.participant_id, s]))

  // Build leaderboard — include participants with no scores yet
  const scoredIds = new Set((scores || []).map((s: any) => s.participant_id))
  const unscoredParticipants = (participants || []).filter(p => !scoredIds.has(p.id))

  const allScores = [
    ...(scores || []),
    ...unscoredParticipants.map(p => ({
      participant_id: p.id,
      competition_id: competition.id,
      total_points: 0,
      exact_scores: 0,
      correct_results: 0,
      accuracy_pct: 0,
      last_updated: null,
    })),
  ]

  const leaderboard: LeaderboardEntry[] = allScores.map((score, index) => ({
    rank: index + 1,
    participant: participantMap.get(score.participant_id)!,
    score,
    special: specialMap.get(score.participant_id) || null,
  })).filter(e => e.participant)

  return { competition, leaderboard }
}

export default async function DashboardPage({ params }: Props) {
  const { competition, leaderboard } = await getLeaderboard(params.slug)
  if (!competition) notFound()

  return (
    <main className="min-h-screen pitch-bg">
      <CompetitionHeader competition={competition} />

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-5xl mb-4">🏟️</p>
          <p className="text-green-300 text-lg">Competition is warming up…</p>
          <p className="text-green-500/60 text-sm mt-2">Predictions will appear here once uploaded.</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 pb-16 space-y-10">
          {/* Rat race */}
          <section>
            <h2 className="text-green-300/70 text-sm font-medium uppercase tracking-widest mb-4">
              Race to the top
            </h2>
            <RaceTrack leaderboard={leaderboard} />
          </section>

          {/* Score table */}
          <section>
            <h2 className="text-green-300/70 text-sm font-medium uppercase tracking-widest mb-4">
              Full standings
            </h2>
            <ScoreTable leaderboard={leaderboard} />
          </section>
        </div>
      )}

      {/* Auto-refresh */}
      <AutoRefresh />
    </main>
  )
}

// Client component for auto-refresh every 5 minutes
function AutoRefresh() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `setTimeout(() => window.location.reload(), 300000)`,
      }}
    />
  )
}
