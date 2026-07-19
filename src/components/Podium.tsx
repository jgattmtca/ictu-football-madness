import { LeaderboardEntry } from '@/types'
import Avatar from './Avatar'

interface Props {
  leaderboard: LeaderboardEntry[]
}

export default function Podium({ leaderboard }: Props) {
  if (leaderboard.length < 2) return null

  const first = leaderboard[0]
  const second = leaderboard[1]

  // Find all participants tied for 3rd (same points as position 3)
  const thirdPoints = leaderboard[2]?.score.total_points
  const third = leaderboard.filter(e =>
    e.score.total_points === thirdPoints &&
    e.participant.id !== first.participant.id &&
    e.participant.id !== second.participant.id
  )

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <p className="text-center text-xs font-medium uppercase tracking-widest mb-6" style={{ color: '#fbbf24', letterSpacing: '0.3em' }}>
        🏆 Competition Winners
      </p>
      <div className="flex items-end justify-center gap-4">

        {/* 2nd place */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Avatar participant={second.participant} size="lg" />
          <p className="text-white font-semibold text-sm text-center">{second.participant.name}</p>
          <p className="text-yellow-300/70 text-xs font-bold">{second.score.total_points} pts</p>
          <div className="w-full rounded-t-xl flex items-center justify-center py-4 text-3xl"
            style={{ background: 'linear-gradient(180deg, #9ca3af, #6b7280)', minHeight: '80px' }}>
            🥈
          </div>
        </div>

        {/* 1st place — tallest */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="text-2xl animate-bounce">👑</div>
          <Avatar participant={first.participant} size="xl" isLeader />
          <p className="text-white font-bold text-sm text-center">{first.participant.name}</p>
          <p className="text-yellow-300 text-xs font-bold">{first.score.total_points} pts</p>
          <div className="w-full rounded-t-xl flex items-center justify-center py-6 text-3xl"
            style={{ background: 'linear-gradient(180deg, #fbbf24, #d97706)', minHeight: '110px' }}>
            🥇
          </div>
        </div>

        {/* 3rd place — handles ties */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {third.map((entry, i) => (
            <div key={entry.participant.id} className={`flex flex-col items-center gap-1 ${i > 0 ? 'mt-2' : ''}`}>
              <Avatar participant={entry.participant} size="lg" />
              <p className="text-white font-semibold text-sm text-center">{entry.participant.name}</p>
            </div>
          ))}
          <p className="text-yellow-300/70 text-xs font-bold">{thirdPoints} pts</p>
          <div className="w-full rounded-t-xl flex items-center justify-center py-3 text-3xl"
            style={{ background: 'linear-gradient(180deg, #cd7c2f, #92400e)', minHeight: '60px' }}>
            🥉
          </div>
        </div>

      </div>
    </div>
  )
}