import * as XLSX from 'xlsx'
import { ParsedPrediction } from '@/types'

/**
 * Parses a participant prediction Excel file.
 * File format: Group_Stage_Predictions_PlayerName.xlsx
 *
 * Columns (0-indexed):
 *   0 = Date, 1 = Time, 2 = Home Team, 3 = Away Team,
 *   4 = Predicted Home Score, 5 = Predicted Away Score,
 *   8 = Winner (col I) — row 4 also holds "Golden Boot" label
 *
 * Row 0: "SCHEDULE" header
 * Row 1: column headers
 * Row 4: has "Golden Boot" in col 8 — participant writes player name in col 9
 * Rows 2+: match data
 */
export function parseParticipantExcel(buffer: Buffer, filename: string): ParsedPrediction {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  // Extract participant name from filename: "Group_Stage_Predictions_John_Doe.xlsx" → "John Doe"
  const rawName = filename
    .replace(/\.xlsx?$/i, '')
    .replace(/Group_Stage_Predictions_/i, '')
    .replace(/_/g, ' ')
    .replace(/Insert Name/i, '')
    .trim()
  const participantName = rawName || 'Unknown'

  // Collect golden boot (row index 3 = Row 4 in Excel, col index 9)
  let goldenBoot: string | null = null
  if (rows[3] && rows[3][9] != null) {
    goldenBoot = String(rows[3][9]).trim() || null
  }

  // Collect tournament winner — look for non-empty value in col 8 (Winner)
  // skipping the header row
  let tournamentWinner: string | null = null
  for (let i = 2; i < rows.length; i++) {
    const val = rows[i]?.[8]
    if (val != null && String(val).trim() && String(val).trim().toLowerCase() !== 'winner') {
      tournamentWinner = String(val).trim()
      break
    }
  }

  // Collect match predictions — rows 2 onwards, cols 2,3 = teams, 4,5 = scores
  const matchPredictions: ParsedPrediction['matchPredictions'] = []

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const homeTeam = row[2] != null ? String(row[2]).trim() : null
    const awayTeam = row[3] != null ? String(row[3]).trim() : null
    if (!homeTeam || !awayTeam) continue

    const rawHome = row[4]
    const rawAway = row[5]
    const homeScore = rawHome != null && !isNaN(Number(rawHome)) ? Number(rawHome) : null
    const awayScore = rawAway != null && !isNaN(Number(rawAway)) ? Number(rawAway) : null

    matchPredictions.push({ homeTeam, awayTeam, homeScore, awayScore })
  }

  return { participantName, matchPredictions, tournamentWinner, goldenBoot }
}

/**
 * Calculates points for a single prediction vs actual result.
 */
export function calculateMatchPoints(
  predHome: number | null,
  predAway: number | null,
  actualHome: number | null,
  actualAway: number | null,
  scoringRules: { exact_score: number; correct_result: number }
): number {
  if (predHome === null || predAway === null) return 0
  if (actualHome === null || actualAway === null) return 0

  // Exact score
  if (predHome === actualHome && predAway === actualAway) {
    return scoringRules.exact_score
  }

  // Correct result (W/D/L)
  const predResult = Math.sign(predHome - predAway)
  const actualResult = Math.sign(actualHome - actualAway)
  if (predResult === actualResult) {
    return scoringRules.correct_result
  }

  return 0
}

/**
 * Generates a deterministic avatar colour from a name string.
 */
export function avatarColor(name: string): string {
  const colours = [
    '#16a34a', '#2563eb', '#9333ea', '#dc2626',
    '#ea580c', '#0891b2', '#65a30d', '#db2777',
    '#7c3aed', '#059669',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colours[Math.abs(hash) % colours.length]
}

/**
 * Returns 2-letter initials from a full name.
 */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
