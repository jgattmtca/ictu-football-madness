'use client'
import { useEffect, useState } from 'react'
import { LeaderboardEntry } from '@/types'
import Avatar from './Avatar'

interface Props {
  leaderboard: LeaderboardEntry[]
}

interface ScorecardRow {
  homeTeam: string
  awayTeam: string
  actualHome: number
  actualAway: number
  predHome: number | null
  predAway: number | null
  points: number
  result: 'exact' | 'correct' | 'miss'
}

export default function RaceTrack({ leaderboard }: Props) {
  const [mounted, setMounted] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)
  const [scorecard, setScorecard] = useState<ScorecardRow[]>([])
  const [loadingCard, setLoadingCard] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (leaderboard.length > 0 && leaderboard[0].score.total_points > 0) {
      setTimeout(() => launchConfetti(), 800)
    }
  }, [leaderboard])

  async function handleAvatarClick(entry: LeaderboardEntry) {
    setSelectedEntry(entry)
    setLoadingCard(true)
    setScorecard([])
    try {
      const res = await fetch(
        `/api/scores/scorecard?participantId=${entry.participant.id}&competitionId=${entry.participant.competition_id}`
      )
      const data = await res.json()
      setScorecard(data.scorecard || [])
    } catch {}
    setLoadingCard(false)
  }

  const maxPoints = Math.max(...leaderboard.map(e => e.score.total_points), 1)
  const topEntries = leaderboard.slice(0, Math.min(leaderboard.length, 12))

  return (
    <>
      <div className="relative">
        <div className="bg-black/40 rounded-3xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-green-400/70 text-xs uppercase tracking-widest">
              <span>🏁</span> Race track
            </div>
            <div className="text-green-400/50 text-xs">
              {leaderboard[0]?.score.total_points > 0
                ? `Leader: ${leaderboard[0].score.total_points} pts`
                : 'Competition not started'}
            </div>
          </div>

          <div className="p-4 space-y-3">
            {topEntries.map((entry, i) => {
              const pct = maxPoints > 0
                ? Math.max((entry.score.total_points / maxPoints) * 100, 3)
                : 3
              const isLeader = i === 0 && entry.score.total_points > 0

              return (
                <div key={entry.participant.id} className="flex items-center gap-3">
                  <div className="w-7 text-center flex-shrink-0">
                    {i === 0 && entry.score.total_points > 0 ? (
                      <span className="text-lg">🥇</span>
                    ) : i === 1 ? (
                      <span className="text-lg">🥈</span>
                    ) : i === 2 ? (
                      <span className="text-lg">🥉</span>
                    ) : (
                      <span className="text-green-500/50 text-sm font-mono">{i + 1}</span>
                    )}
                  </div>

                  {/* Clickable avatar */}
                  <button
                    onClick={() => handleAvatarClick(entry)}
                    className="flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
                    title={`View ${entry.participant.name}'s scorecard`}
                  >
                    <Avatar participant={entry.participant} size="sm" isLeader={isLeader} />
                  </button>

                  <div className="flex-1 race-lane h-10 flex items-center">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000 ease-out relative"
                      style={{
                        width: mounted ? `${pct}%` : '3%',
                        background: isLeader
                          ? 'linear-gradient(90deg, #166534, #22c55e)'
                          : 'linear-gradient(90deg, #1a3a1a, #15803d)',
                        minWidth: 40,
                      }}
                    >
                      <span className={`text-base leading-none ${isLeader ? 'animate-race-bounce' : ''}`}>
                        🏃
                      </span>
                    </div>
                  </div>

                  {/* Name + points */}
                  <div className="flex items-center gap-2 w-40 flex-shrink-0">
                    <span className="text-white/80 text-xs truncate">{entry.participant.name}</span>
                    <span className={`text-sm font-bold ml-auto ${isLeader ? 'text-yellow-300' : 'text-white/70'}`}>
                      {entry.score.total_points}
                      <span className="text-green-600/60 text-xs ml-0.5">pts</span>
                    </span>
                  </div>
                </div>
              )
            })}

            {leaderboard.length > 12 && (
              <p className="text-center text-green-600/50 text-xs pt-2">
                +{leaderboard.length - 12} more in the table below
              </p>
            )}
          </div>

          <div className="flex items-center gap-0 px-6 pb-4 pt-1">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-white/20 text-xs px-3">🏁 finish</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
        </div>
      </div>

      {/* Scorecard modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-[#0f1f0f] border border-white/10 rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Avatar participant={selectedEntry.participant} size="md" />
                <div>
                  <p className="text-white font-semibold">{selectedEntry.participant.name}</p>
                  <p className="text-green-400/60 text-xs">
                    {selectedEntry.score.total_points} pts · {selectedEntry.score.exact_scores} exact · {selectedEntry.score.correct_results} correct
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-white/40 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Scorecard table */}
            <div className="overflow-y-auto flex-1">
              {loadingCard ? (
                <div className="text-center py-10 text-green-400/50">
                  <div className="text-3xl mb-2 animate-bounce">⚽</div>
                  <p>Loading scorecard…</p>
                </div>
              ) : scorecard.length === 0 ? (
                <div className="text-center py-10 text-green-400/50">
                  <p>No finished matches yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-2 text-green-400/50 text-xs font-medium">Match</th>
                      <th className="text-center px-3 py-2 text-green-400/50 text-xs font-medium">Result</th>
                      <th className="text-center px-3 py-2 text-green-400/50 text-xs font-medium">Predicted</th>
                      <th className="text-center px-4 py-2 text-green-400/50 text-xs font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecard.map((row, i) => (
                      <tr key={i} className={`border-b border-white/5 ${
                        row.result === 'exact' ? 'bg-green-900/20' :
                        row.result === 'correct' ? 'bg-blue-900/10' : ''
                      }`}>
                        <td className="px-4 py-2.5">
                          <p className="text-white/80 text-xs">
                            {row.homeTeam} vs {row.awayTeam}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-white font-medium text-xs">
                            {row.actualHome} – {row.actualAway}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {row.predHome !== null ? (
                            <span className={`text-xs font-medium ${
                              row.result === 'exact' ? 'text-green-400' :
                              row.result === 'correct' ? 'text-blue-400' :
                              'text-red-400/70'
                            }`}>
                              {row.predHome} – {row.predAway}
                            </span>
                          ) : (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`font-bold text-sm ${
                            row.points === 5 ? 'text-green-400' :
                            row.points === 3 ? 'text-blue-400' :
                            'text-white/20'
                          }`}>
                            {row.points > 0 ? `+${row.points}` : '0'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Legend */}
            <div className="px-5 py-3 border-t border-white/10 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-green-400/70">
                <span className="w-2 h-2 rounded-full bg-green-900/60 border border-green-500/30" />
                Exact score (+5)
              </span>
              <span className="flex items-center gap-1.5 text-blue-400/70">
                <span className="w-2 h-2 rounded-full bg-blue-900/60 border border-blue-500/30" />
                Correct result (+3)
              </span>
              <span className="flex items-center gap-1.5 text-white/30">
                <span className="w-2 h-2 rounded-full bg-white/5" />
                Miss (0)
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function launchConfetti() {
  if (typeof window === 'undefined') return
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
  script.onload = () => {
    const confetti = (window as any).confetti
    if (!confetti) return
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.4 },
      colors: ['#22c55e', '#16a34a', '#fbbf24', '#ffffff', '#15803d'],
    })
    setTimeout(() => confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
      colors: ['#22c55e', '#fbbf24', '#ffffff'],
    }), 300)
    setTimeout(() => confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
      colors: ['#22c55e', '#fbbf24', '#ffffff'],
    }), 500)
  }
  document.head.appendChild(script)
}