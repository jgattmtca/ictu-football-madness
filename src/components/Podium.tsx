import { LeaderboardEntry } from '@/types'
import Avatar from './Avatar'

interface Props {
  leaderboard: LeaderboardEntry[]
}

export default function Podium({ leaderboard }: Props) {
  const top3 = leaderboard.slice(0, 3)
  if (top3.length < 3) return null

  const [first, second, third] = top3

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

        {/* 3rd place */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Avatar participant={third.participant} size="lg" />
          <p className="text-white font-semibold text-sm text-center">{third.participant.name}</p>
          <p className="text-yellow-300/70 text-xs font-bold">{third.score.total_points} pts</p>
          <div className="w-full rounded-t-xl flex items-center justify-center py-3 text-3xl"
            style={{ background: 'linear-gradient(180deg, #cd7c2f, #92400e)', minHeight: '60px' }}>
            🥉
          </div>
        </div>

      </div>
    </div>
  )
}