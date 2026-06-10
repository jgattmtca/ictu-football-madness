// ── Core domain types ────────────────────────────────────────────────────────

export interface Competition {
  id: string
  slug: string
  name: string
  sport: string
  logo_url: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  scoring: ScoringRules
  created_at: string
}

export interface ScoringRules {
  exact_score: number
  correct_result: number
  tournament_winner: number
  golden_boot: number
}

export interface Participant {
  id: string
  competition_id: string
  name: string
  email: string | null
  avatar_url: string | null
  avatar_initials: string
  avatar_color: string
  paid_jackpot: boolean
  created_at: string
}

export interface Match {
  id: string
  competition_id: string
  match_date: string | null
  match_time: string | null
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  status: 'scheduled' | 'live' | 'finished'
  api_match_id: string | null
  created_at: string
}

export interface Prediction {
  id: string
  competition_id: string
  participant_id: string
  match_id: string
  home_score: number | null
  away_score: number | null
  created_at: string
}

export interface SpecialPrediction {
  id: string
  competition_id: string
  participant_id: string
  tournament_winner: string | null
  golden_boot_player: string | null
  created_at: string
}

export interface Score {
  id: string
  competition_id: string
  participant_id: string
  total_points: number
  exact_scores: number
  correct_results: number
  accuracy_pct: number
  last_updated: string
}

// ── Composite / view types ───────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  participant: Participant
  score: Score
  special: SpecialPrediction | null
  previousRank?: number
}

export interface ParsedPrediction {
  participantName: string
  matchPredictions: {
    homeTeam: string
    awayTeam: string
    homeScore: number | null
    awayScore: number | null
  }[]
  tournamentWinner: string | null
  goldenBoot: string | null
}
