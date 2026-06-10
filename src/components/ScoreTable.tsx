'use client'
import { LeaderboardEntry } from '@/types'
import Avatar from './Avatar'

interface Props { leaderboard: LeaderboardEntry[] }

export default function ScoreTable({ leaderboard }: Props) {
  return (
    <div className="bg-black/40 rounded-3xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left px-5 py-3 text-green-400/60 text-xs uppercase tracking-widest font-medium w-10">#</th>
            <th className="text-left px-3 py-3 text-green-400/60 text-xs uppercase tracking-widest font-medium">Player</th>
            <th className="text-right px-4 py-3 text-green-400/60 text-xs uppercase tracking-widest font-medium">Points</th>
            <th className="text-right px-4 py-3 text-green-400/60 text-xs uppercase tracking-widest font-medium hidden sm:table-cell">Exact</th>
            <th className="text-right px-4 py-3 text-green-400/60 text-xs uppercase tracking-widest font-medium hidden sm:table-cell">Result ✓</th>
            <th className="text-right px-5 py-3 text-green-400/60 text-xs uppercase tracking-widest font-medium hidden md:table-cell">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, i) => {
            const isLeader = i === 0 && entry.score.total_points > 0
            const isPodium = i < 3 && entry.score.total_points > 0
            return (
              <tr
                key={entry.participant.id}
                className={`border-b border-white/5 transition-colors ${
                  isLeader ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 'hover:bg-white/5'
                }`}
              >
                <td className="px-5 py-3.5">
                  {i === 0 && entry.score.total_points > 0 ? (
                    <span>🥇</span>
                  ) : i === 1 ? (
                    <span>🥈</span>
                  ) : i === 2 ? (
                    <span>🥉</span>
                  ) : (
                    <span className="text-white/30 font-mono">{i + 1}</span>
                  )}
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar participant={entry.participant} size="sm" isLeader={isLeader} />
                    <div>
                      <p className={`font-medium ${isLeader ? 'text-yellow-300' : 'text-white'}`}>
                        {entry.participant.name}
                      </p>
                      {entry.special?.tournament_winner && (
                        <p className="text-green-500/50 text-xs">
                          🏆 {entry.special.tournament_winner}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`font-bold text-base ${isLeader ? 'text-yellow-300' : 'text-white'}`}>
                    {entry.score.total_points}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                  <span className="text-green-400">{entry.score.exact_scores}</span>
                </td>
                <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                  <span className="text-blue-400">{entry.score.correct_results}</span>
                </td>
                <td className="px-5 py-3.5 text-right hidden md:table-cell">
                  <span className="text-white/60">{Math.round(entry.score.accuracy_pct)}%</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
