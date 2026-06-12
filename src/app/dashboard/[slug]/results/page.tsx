'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Props { params: { slug: string } }

interface Fixture {
  status?: string
  fixture?: { id: number; status?: { short: string; elapsed?: number } }
  teams?: { home: { name: string; logo?: string }; away: { name: string; logo?: string } }
  goals?: { home: number | null; away: number | null }
  score?: { home: number | null; away: number | null; fullTime?: { home: number | null; away: number | null } }
  date?: string
  homeTeam?: { name: string }
  awayTeam?: { name: string }
  utcDate?: string
}

interface Standing {
  rank?: number
  team?: { name: string; logo?: string }
  teamName?: string
  points?: number
  all?: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
  played?: number; won?: number; drawn?: number; lost?: number
  goalsFor?: number; goalsAgainst?: number
  goalsDiff?: number
  group?: string
}

interface TopScorer {
  player?: { name: string; nationality?: string }
  playerName?: string
  statistics?: Array<{ goals?: { total: number }; team?: { name: string } }>
  goals?: number
  teamName?: string
}

type Tab = 'results' | 'upcoming' | 'standings' | 'topscorers'

export default function ResultsPage({ params }: Props) {
  const [tab, setTab] = useState<Tab>('results')
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [standings, setStandings] = useState<any[]>([])
  const [topScorers, setTopScorers] = useState<TopScorer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFixtures()
  }, [])

  useEffect(() => {
    if (tab === 'standings' && standings.length === 0) loadStandings()
    if (tab === 'topscorers' && topScorers.length === 0) loadTopScorers()
  }, [tab])

  async function loadFixtures() {
    setLoading(true)
    try {
      const res = await fetch('/api/football?type=fixtures')
      const json = await res.json()
      setFixtures(json.data || [])
    } catch {
      setError('Could not load fixtures. Check your API key.')
    }
    setLoading(false)
  }

  async function loadStandings() {
    try {
      const res = await fetch('/api/football?type=standings')
      const json = await res.json()
      setStandings(json.data || [])
    } catch {}
  }

  async function loadTopScorers() {
    try {
      const res = await fetch('/api/football?type=topscorers')
      const json = await res.json()
      setTopScorers(json.data || [])
    } catch {}
  }

  function normaliseFixture(f: Fixture) {
    const homeTeam = f.teams?.home?.name ?? f.homeTeam?.name ?? 'TBD'
    const awayTeam = f.teams?.away?.name ?? f.awayTeam?.name ?? 'TBD'
    const homeGoals = f.score?.fullTime?.home ?? f.goals?.home ?? f.score?.home ?? null
    const awayGoals = f.score?.fullTime?.away ?? f.goals?.away ?? f.score?.away ?? null
    const statusRaw = f.status ?? f.fixture?.status?.short ?? ''
    const isFinished = ['FINISHED', 'FT', 'AET', 'PEN'].includes(statusRaw)
    const isLive = ['IN_PLAY', 'PAUSED', '1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(statusRaw)
    const elapsed = f.fixture?.status?.elapsed
    return { homeTeam, awayTeam, homeGoals, awayGoals, statusRaw, isFinished, isLive, elapsed }
  }

  const finished = fixtures.filter(f => normaliseFixture(f).isFinished)
  const live = fixtures.filter(f => normaliseFixture(f).isLive)
  const upcoming = fixtures.filter(f => {
    const { isFinished, isLive } = normaliseFixture(f)
    return !isFinished && !isLive
  })

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'results', label: '✅ Results', count: finished.length },
    { key: 'upcoming', label: '📅 Upcoming', count: upcoming.length },
    { key: 'standings', label: '📊 Standings' },
    { key: 'topscorers', label: '👟 Top scorers' },
  ]

  return (
    <div className="min-h-screen pitch-bg">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/${params.slug}`} className="text-green-400 hover:text-green-300 text-sm">
              ← Leaderboard
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-white font-semibold">Match centre</span>
            {live.length > 0 && (
              <span className="flex items-center gap-1 text-xs bg-red-500/20 border border-red-500/40 text-red-400 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                {live.length} live
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-green-300/70 hover:bg-white/10'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-white/20' : 'bg-white/10'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-20 text-green-400/60">
            <div className="text-4xl mb-3 animate-bounce">⚽</div>
            <p>Loading match data…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-6 text-center text-red-300">
            <p className="text-2xl mb-2">⚠️</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {tab === 'results' && (
              <div className="space-y-3">
                {live.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-red-400 text-xs font-medium uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" /> Live now
                    </h2>
                    <div className="space-y-2">
                      {live.map((f, i) => <MatchCard key={i} fixture={f} highlight />)}
                    </div>
                  </div>
                )}
                {finished.length === 0 && live.length === 0 ? (
                  <EmptyState icon="🏟️" message="No results yet — competition kicks off June 11th!" />
                ) : (
                  finished.slice().reverse().map((f, i) => <MatchCard key={i} fixture={f} />)
                )}
              </div>
            )}

            {tab === 'upcoming' && (
              <div className="space-y-3">
                {upcoming.length === 0 ? (
                  <EmptyState icon="🏁" message="All matches have been played!" />
                ) : (
                  upcoming.slice(0, 20).map((f, i) => <MatchCard key={i} fixture={f} upcoming />)
                )}
              </div>
            )}

            {tab === 'standings' && (
              <StandingsView standings={standings} />
            )}

            {tab === 'topscorers' && (
              <TopScorersView scorers={topScorers} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MatchCard({ fixture, highlight = false, upcoming = false }: {
  fixture: Fixture; highlight?: boolean; upcoming?: boolean
}) {
  const homeTeam = fixture.teams?.home?.name ?? fixture.homeTeam?.name ?? 'TBD'
  const awayTeam = fixture.teams?.away?.name ?? fixture.awayTeam?.name ?? 'TBD'
  const homeGoals = fixture.score?.fullTime?.home ?? fixture.goals?.home ?? fixture.score?.home
  const awayGoals = fixture.score?.fullTime?.away ?? fixture.goals?.away ?? fixture.score?.away
  const statusRaw = fixture.status ?? fixture.fixture?.status?.short ?? ''
  const isLive = ['IN_PLAY', 'PAUSED', '1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(statusRaw)
  const elapsed = fixture.fixture?.status?.elapsed

  // Format match time from utcDate
  const matchTime = fixture.utcDate
    ? new Date(fixture.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null
  const matchDate = fixture.utcDate
    ? new Date(fixture.utcDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : null

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      highlight
        ? 'bg-red-900/20 border-red-500/30'
        : 'bg-black/30 border-white/10'
    }`}>
      {matchDate && (
        <p className="text-center text-green-400/40 text-xs mb-2">{matchDate} {matchTime}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-right">
          <span className="text-white font-medium text-sm sm:text-base">{homeTeam}</span>
        </div>

        <div className="mx-4 flex-shrink-0 text-center min-w-[80px]">
          {upcoming ? (
            <span className="text-green-400/60 text-sm">vs</span>
          ) : homeGoals !== null && homeGoals !== undefined ? (
            <div className="flex items-center gap-2 justify-center">
              <span className="text-white font-bold text-xl">{homeGoals}</span>
              <span className="text-white/30">–</span>
              <span className="text-white font-bold text-xl">{awayGoals}</span>
            </div>
          ) : (
            <span className="text-green-400/40 text-sm">vs</span>
          )}
          {isLive && elapsed && (
            <div className="text-red-400 text-xs mt-1 font-medium">{elapsed}'</div>
          )}
          {!upcoming && !isLive && statusRaw && (
            <div className="text-green-500/40 text-xs mt-1">{statusRaw}</div>
          )}
        </div>

        <div className="flex-1 text-left">
          <span className="text-white font-medium text-sm sm:text-base">{awayTeam}</span>
        </div>
      </div>
    </div>
  )
}

function StandingsView({ standings }: { standings: any[] }) {
  if (standings.length === 0) {
    return <EmptyState icon="📊" message="Standings not available yet." />
  }

  const groups: Record<string, any[]> = {}
  for (const item of standings) {
    const group = item.group ?? item.stage ?? 'Group Stage'
    if (!groups[group]) groups[group] = []
    groups[group].push(item)
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([groupName, teams]) => (
        <div key={groupName} className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-green-300/70 text-xs font-medium uppercase tracking-widest">{groupName}</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-2 text-green-400/50 text-xs font-medium w-6">#</th>
                <th className="text-left px-3 py-2 text-green-400/50 text-xs font-medium">Team</th>
                <th className="text-center px-2 py-2 text-green-400/50 text-xs font-medium">P</th>
                <th className="text-center px-2 py-2 text-green-400/50 text-xs font-medium">W</th>
                <th className="text-center px-2 py-2 text-green-400/50 text-xs font-medium">D</th>
                <th className="text-center px-2 py-2 text-green-400/50 text-xs font-medium">L</th>
                <th className="text-center px-2 py-2 text-green-400/50 text-xs font-medium hidden sm:table-cell">GF</th>
                <th className="text-center px-2 py-2 text-green-400/50 text-xs font-medium hidden sm:table-cell">GA</th>
                <th className="text-center px-2 py-2 text-green-400/50 text-xs font-medium hidden sm:table-cell">GD</th>
                <th className="text-center px-4 py-2 text-green-400/50 text-xs font-medium font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => {
                const name = team.team?.name ?? team.teamName ?? '?'
                const rank = team.rank ?? i + 1
                const pts = team.points ?? 0
                const played = team.all?.played ?? team.played ?? team.playedGames ?? 0
                const won = team.all?.win ?? team.won ?? team.won ?? 0
                const drawn = team.all?.draw ?? team.drawn ?? team.draw ?? 0
                const lost = team.all?.lose ?? team.lost ?? team.lost ?? 0
                const gf = team.all?.goals?.for ?? team.goalsFor ?? 0
                const ga = team.all?.goals?.against ?? team.goalsAgainst ?? 0
                const gd = team.goalsDifference ?? team.goalsDiff ?? (gf - ga)
                const isQualifying = rank <= 2

                return (
                  <tr key={i} className={`border-b border-white/5 ${isQualifying ? 'bg-green-900/10' : ''}`}>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{rank}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-medium text-sm ${isQualifying ? 'text-green-300' : 'text-white/80'}`}>
                        {name}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-white/50 text-xs">{played}</td>
                    <td className="px-2 py-2.5 text-center text-green-400 text-xs">{won}</td>
                    <td className="px-2 py-2.5 text-center text-yellow-400/70 text-xs">{drawn}</td>
                    <td className="px-2 py-2.5 text-center text-red-400/70 text-xs">{lost}</td>
                    <td className="px-2 py-2.5 text-center text-white/40 text-xs hidden sm:table-cell">{gf}</td>
                    <td className="px-2 py-2.5 text-center text-white/40 text-xs hidden sm:table-cell">{ga}</td>
                    <td className="px-2 py-2.5 text-center text-white/40 text-xs hidden sm:table-cell">{gd > 0 ? `+${gd}` : gd}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-white">{pts}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function TopScorersView({ scorers }: { scorers: TopScorer[] }) {
  if (scorers.length === 0) {
    return <EmptyState icon="👟" message="Top scorer data not available yet." />
  }

  return (
    <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left px-4 py-3 text-green-400/50 text-xs font-medium w-8">#</th>
            <th className="text-left px-3 py-3 text-green-400/50 text-xs font-medium">Player</th>
            <th className="text-left px-3 py-3 text-green-400/50 text-xs font-medium hidden sm:table-cell">Team</th>
            <th className="text-center px-4 py-3 text-green-400/50 text-xs font-medium">Goals</th>
          </tr>
        </thead>
        <tbody>
          {scorers.slice(0, 20).map((s, i) => {
            const name = s.player?.name ?? s.playerName ?? '?'
            const team = s.statistics?.[0]?.team?.name ?? s.teamName ?? '?'
            const goals = s.statistics?.[0]?.goals?.total ?? s.goals ?? 0
            const isLeader = i === 0

            return (
              <tr key={i} className={`border-b border-white/5 ${isLeader ? 'bg-yellow-500/5' : ''}`}>
                <td className="px-4 py-3">
                  {i === 0 ? <span className="text-lg">🥇</span>
                    : i === 1 ? <span className="text-lg">🥈</span>
                    : i === 2 ? <span className="text-lg">🥉</span>
                    : <span className="text-white/30 font-mono text-xs">{i + 1}</span>}
                </td>
                <td className="px-3 py-3">
                  <span className={`font-medium ${isLeader ? 'text-yellow-300' : 'text-white/90'}`}>{name}</span>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell">
                  <span className="text-green-400/60 text-xs">{team}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold text-base ${isLeader ? 'text-yellow-300' : 'text-white'}`}>{goals}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="text-center py-16 text-green-400/50">
      <p className="text-4xl mb-3">{icon}</p>
      <p>{message}</p>
    </div>
  )
}