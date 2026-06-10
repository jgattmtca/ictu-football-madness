'use client'
import { useState, useEffect } from 'react'
import { LeaderboardEntry } from '@/types'
import Avatar from './Avatar'

interface ShameData {
  howler: {
    participant: any
    homeTeam: string
    awayTeam: string
    predictedHome: number
    predictedAway: number
    actualHome: number
    actualAway: number
    shameScore: number
  } | null
  coldStreak: {
    participant: any
    matchesWithoutPoints: number
  } | null
  funStats: {
    label: string
    value: string
    icon: string
  }[]
  bottomThree: {
    participant: any
    points: number
    rank: number
  }[]
}

interface Props {
  leaderboard: LeaderboardEntry[]
  competitionId: string
}

export default function HallOfShame({ leaderboard, competitionId }: Props) {
  const [shame, setShame] = useState<ShameData | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch(`/api/scores/shame?competitionId=${competitionId}`)
      .then(r => r.json())
      .then(d => setShame(d))
      .catch(() => {})
  }, [competitionId])

  // Build bottom 3 from leaderboard
  const bottom3 = leaderboard
    .filter(e => e.score.total_points >= 0)
    .slice(-3)
    .reverse()

  // Fun stats from leaderboard
  const totalPlayers = leaderboard.length
  const mbappeCount = leaderboard.filter(e =>
    e.special?.golden_boot_player?.toLowerCase().includes('mbappe')
  ).length
  const franceCount = leaderboard.filter(e =>
    e.special?.tournament_winner?.toLowerCase() === 'france'
  ).length
  const leader = leaderboard[0]
  const last = leaderboard[leaderboard.length - 1]
  const pointsGap = leader && last
    ? leader.score.total_points - last.score.total_points
    : 0

  if (leaderboard.every(e => e.score.total_points === 0)) {
    return null // Don't show before competition starts
  }

  return (
    <section>
      <button
        onClick={() => setExpanded(s => !s)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <h2 className="text-green-300/70 text-sm font-medium uppercase tracking-widest flex items-center gap-2">
          😈 Hall of Shame
        </h2>
        <span className="text-green-500/50 text-xs group-hover:text-green-400 transition-colors">
          {expanded ? 'Hide ▲' : 'Show ▼'}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Howler of the week */}
          {shame?.howler && (
            <ShameCard
              title="🤦 Howler of the week"
              subtitle="Worst prediction so far"
              color="red"
            >
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar participant={shame.howler.participant} size="sm" />
                  <span className="text-white font-medium">{shame.howler.participant.name}</span>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center">
                  <p className="text-white/60 text-xs mb-1">{shame.howler.homeTeam} vs {shame.howler.awayTeam}</p>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <p className="text-xs text-green-400/60">Predicted</p>
                      <p className="text-white font-bold">{shame.howler.predictedHome} – {shame.howler.predictedAway}</p>
                    </div>
                    <span className="text-white/20 text-xl">→</span>
                    <div>
                      <p className="text-xs text-red-400/60">Actual</p>
                      <p className="text-red-300 font-bold">{shame.howler.actualHome} – {shame.howler.actualAway}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ShameCard>
          )}

          {/* Wooden spoon race */}
          <ShameCard
            title="🥄 Wooden spoon race"
            subtitle="Fighting to avoid last place"
            color="amber"
          >
            <div className="mt-3 space-y-2">
              {bottom3.map((entry, i) => (
                <div key={entry.participant.id} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">
                    {i === 0 ? '🥄' : i === 1 ? '😬' : '😅'}
                  </span>
                  <Avatar participant={entry.participant} size="sm" />
                  <span className="flex-1 text-white/80 text-sm">{entry.participant.name}</span>
                  <span className="text-amber-400 font-bold text-sm">{entry.score.total_points} pts</span>
                </div>
              ))}
            </div>
          </ShameCard>

          {/* Cold streak */}
          {shame?.coldStreak && shame.coldStreak.matchesWithoutPoints > 3 && (
            <ShameCard
              title="🥶 Ice cold"
              subtitle={`${shame.coldStreak.participant.name} hasn't scored in ${shame.coldStreak.matchesWithoutPoints} matches`}
              color="blue"
            >
              <div className="flex items-center gap-3 mt-3">
                <Avatar participant={shame.coldStreak.participant} size="md" />
                <div>
                  <p className="text-white font-medium">{shame.coldStreak.participant.name}</p>
                  <p className="text-blue-300/70 text-sm">
                    {shame.coldStreak.matchesWithoutPoints} consecutive blanks ❄️
                  </p>
                </div>
              </div>
            </ShameCard>
          )}

          {/* Fun stats */}
          <ShameCard title="📊 Fun facts" subtitle="The numbers don't lie" color="purple">
            <div className="mt-3 space-y-2 text-sm">
              {mbappeCount > 0 && (
                <StatLine
                  icon="👟"
                  text={`${mbappeCount} out of ${totalPlayers} people picked Mbappé for golden boot${mbappeCount > 15 ? ' 😅 Original thinkers you are not' : ''}`}
                />
              )}
              {franceCount > 0 && (
                <StatLine
                  icon="🇫🇷"
                  text={`${franceCount} people picked France to win the tournament`}
                />
              )}
              {pointsGap > 0 && leader && last && (
                <StatLine
                  icon="📏"
                  text={`${leader.participant.name} leads ${last.participant.name} by ${pointsGap} points`}
                />
              )}
              {leaderboard.length > 0 && (
                <StatLine
                  icon="🎯"
                  text={`Best accuracy: ${leaderboard.sort((a,b) => b.score.accuracy_pct - a.score.accuracy_pct)[0]?.participant.name} at ${Math.round(leaderboard[0]?.score.accuracy_pct ?? 0)}%`}
                />
              )}
            </div>
          </ShameCard>
        </div>
      )}
    </section>
  )
}

function ShameCard({ title, subtitle, color, children }: {
  title: string; subtitle: string; color: 'red' | 'amber' | 'blue' | 'purple'; children: React.ReactNode
}) {
  const colours = {
    red: 'border-red-500/20 bg-red-900/10',
    amber: 'border-amber-500/20 bg-amber-900/10',
    blue: 'border-blue-500/20 bg-blue-900/10',
    purple: 'border-purple-500/20 bg-purple-900/10',
  }
  const textColours = {
    red: 'text-red-300',
    amber: 'text-amber-300',
    blue: 'text-blue-300',
    purple: 'text-purple-300',
  }

  return (
    <div className={`rounded-2xl border p-4 ${colours[color]}`}>
      <p className={`font-semibold text-sm ${textColours[color]}`}>{title}</p>
      <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>
      {children}
    </div>
  )
}

function StatLine({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2 text-white/70">
      <span className="flex-shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
