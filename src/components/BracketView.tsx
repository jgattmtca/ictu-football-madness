'use client'
import { useState, useEffect } from 'react'

interface BracketMatch {
  id: string
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  status: string
  stage: string
  match_date: string | null
  match_time: string | null
  penalty_home: number | null
  penalty_away: number | null
}

const STAGE_ORDER = ['r32', 'r16', 'qf', 'sf', 'final']
const STAGE_LABELS: Record<string, string> = {
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter finals',
  sf: 'Semi finals',
  final: 'Final',
}
const STAGE_SLOT_COUNT: Record<string, number> = {
  r32: 16,
  r16: 8,
  qf: 4,
  sf: 2,
  final: 1,
}

export default function BracketView() {
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBracket()
  }, [])

  async function loadBracket() {
    setLoading(true)
    try {
      const res = await fetch('/api/bracket')
      const json = await res.json()
      setMatches(json.matches || [])
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-green-400/60">
        <div className="text-4xl mb-3 animate-bounce">🏆</div>
        <p>Loading bracket…</p>
      </div>
    )
  }

  const byStage: Record<string, BracketMatch[]> = {}
  for (const stage of STAGE_ORDER) {
    byStage[stage] = matches.filter(m => m.stage === stage)
  }

  const hasAnyKnockout = STAGE_ORDER.some(s => byStage[s].length > 0)

  if (!hasAnyKnockout) {
    return (
      <div className="text-center py-16 text-green-400/50">
        <p className="text-4xl mb-3">🏆</p>
        <p>Knockout bracket not available yet.</p>
        <p className="text-sm mt-1 text-green-500/40">Check back once the group stage wraps up.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max px-1">
        {STAGE_ORDER.map(stage => {
          const stageMatches = byStage[stage]
          const slotCount = STAGE_SLOT_COUNT[stage]
          const hasData = stageMatches.length > 0

          return (
            <div key={stage} className="flex flex-col" style={{ width: 220, flexShrink: 0 }}>
              <h3 className="text-green-300/70 text-xs font-medium uppercase tracking-widest mb-3 text-center">
                {STAGE_LABELS[stage]}
              </h3>
              <div className="flex flex-col gap-3 flex-1 justify-around">
                {hasData ? (
                  stageMatches.map(match => (
                    <BracketCard key={match.id} match={match} />
                  ))
               ) : (
                  Array.from({ length: slotCount }).map((_, i) => (
                    <BracketPlaceholder key={i} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BracketCard({ match }: { match: BracketMatch }) {
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  const wentToPenalties = match.penalty_home !== null && match.penalty_away !== null
  const homeWon = isFinished && (
    wentToPenalties
      ? match.penalty_home! > match.penalty_away!
      : match.home_score! > match.away_score!
  )
  const awayWon = isFinished && (
    wentToPenalties
      ? match.penalty_away! > match.penalty_home!
      : match.away_score! > match.home_score!
  )

  return (
    <div className={`rounded-xl border p-2.5 ${
      isLive ? 'bg-red-900/20 border-red-500/30' : 'bg-black/30 border-white/10'
    }`}>
      <TeamRow
        name={match.home_team}
        score={match.home_score}
        penalty={wentToPenalties ? match.penalty_home : null}
        winner={homeWon}
        finished={isFinished}
      />
      <div className="h-px bg-white/10 my-1.5" />
      <TeamRow
        name={match.away_team}
        score={match.away_score}
        penalty={wentToPenalties ? match.penalty_away : null}
        winner={awayWon}
        finished={isFinished}
      />
      {wentToPenalties && (
        <p className="text-center text-amber-400/60 text-[10px] mt-1.5">Won on penalties</p>
      )}
      {!isFinished && match.match_date && (
        <p className="text-center text-green-500/40 text-[10px] mt-1.5">
          {new Date(match.match_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          {match.match_time ? ` ${match.match_time}` : ''}
        </p>
      )}
      {isLive && (
        <p className="text-center text-red-400 text-[10px] mt-1.5 flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> Live
        </p>
      )}
    </div>
  )
}
function TeamRow({ name, score, penalty, winner, finished }: {
  name: string; score: number | null; penalty?: number | null; winner: boolean; finished: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-xs truncate ${winner ? 'text-white font-medium' : finished ? 'text-white/40' : 'text-white/80'}`}>
        {name}
      </span>
      <span className={`text-xs font-bold flex-shrink-0 ${winner ? 'text-green-400' : finished ? 'text-white/30' : 'text-white/40'}`}>
        {score !== null ? score : '–'}
        {penalty !== null && penalty !== undefined && (
          <span className="text-amber-400/70 ml-1">({penalty})</span>
        )}
      </span>
    </div>
  )
}

function BracketPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-2.5 bg-black/10">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-white/20">TBD</span>
        <span className="text-xs text-white/20">–</span>
      </div>
      <div className="h-px bg-white/5 my-1.5" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-white/20">TBD</span>
        <span className="text-xs text-white/20">–</span>
      </div>
    </div>
  )
}