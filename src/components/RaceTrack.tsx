'use client'
import { useEffect, useState } from 'react'
import { LeaderboardEntry } from '@/types'
import Avatar from './Avatar'

interface Props { leaderboard: LeaderboardEntry[] }

export default function RaceTrack({ leaderboard }: Props) {
  const [mounted, setMounted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Trigger confetti for the leader on mount
    if (leaderboard.length > 0 && leaderboard[0].score.total_points > 0) {
      setTimeout(() => {
        setShowConfetti(true)
        launchConfetti()
      }, 800)
    }
  }, [leaderboard])

  const maxPoints = Math.max(...leaderboard.map(e => e.score.total_points), 1)

  // Only show top 10 in race track for readability
  const topEntries = leaderboard.slice(0, Math.min(leaderboard.length, 12))

  return (
    <div className="relative">
      {/* Race track container */}
      <div className="bg-black/40 rounded-3xl border border-white/10 overflow-hidden">
        {/* Track header */}
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

        {/* Track lanes */}
        <div className="p-4 space-y-3">
          {topEntries.map((entry, i) => {
            const pct = maxPoints > 0
              ? Math.max((entry.score.total_points / maxPoints) * 100, 3)
              : 3
            const isLeader = i === 0 && entry.score.total_points > 0

            return (
              <div key={entry.participant.id} className="flex items-center gap-3">
                {/* Rank */}
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

                {/* Avatar */}
                <Avatar participant={entry.participant} size="sm" isLeader={isLeader} />

                {/* Lane */}
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
                    {/* Running figure */}
                    <span
                      className={`text-base leading-none ${isLeader ? 'animate-race-bounce' : ''}`}
                      title={entry.participant.name}
                    >
                      🏃
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="w-16 text-right flex-shrink-0">
                  <span className={`text-sm font-bold ${isLeader ? 'text-gold-400' : 'text-white/70'}`}>
                    {entry.score.total_points}
                  </span>
                  <span className="text-green-600/60 text-xs ml-0.5">pts</span>
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

        {/* Finish line */}
        <div className="flex items-center gap-0 px-6 pb-4 pt-1">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-white/20 text-xs px-3">🏁 finish</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      </div>
    </div>
  )
}

function launchConfetti() {
  if (typeof window === 'undefined') return
  // Dynamically load canvas-confetti
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
  script.onload = () => {
    const confetti = (window as any).confetti
    if (!confetti) return
    // Football-themed burst
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.4 },
      colors: ['#22c55e', '#16a34a', '#fbbf24', '#ffffff', '#15803d'],
      shapes: ['circle', 'square'],
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
