import { LeaderboardEntry } from '@/types'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL!
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'ICTU Football Madness'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SendGrid error: ${err}`)
  }
}

export async function sendStandingsEmail(
  participant: { name: string; email: string },
  entry: LeaderboardEntry,
  totalParticipants: number,
  competitionName: string,
  appUrl: string
) {
  const subject = `⚽ ${competitionName} — Your current standings`
  const dashboardUrl = `${appUrl}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 560px; margin: 32px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 28px 24px; }
    .rank-badge { display: inline-block; background: #fbbf24; color: #78350f; border-radius: 50px; padding: 6px 18px; font-size: 15px; font-weight: 700; margin-bottom: 20px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 20px 0; }
    .stat { background: #f0fdf4; border-radius: 8px; padding: 14px; text-align: center; }
    .stat .value { font-size: 24px; font-weight: 700; color: #15803d; }
    .stat .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .cta { display: block; background: #15803d; color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 8px; font-weight: 600; margin-top: 24px; font-size: 15px; }
    .footer { padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚽ ${competitionName}</h1>
      <p>Your latest standings update</p>
    </div>
    <div class="body">
      <p style="color:#374151; font-size:15px;">Hi <strong>${participant.name}</strong>,</p>
      <p style="color:#6b7280; font-size:14px;">Here's how you're doing in the competition:</p>

      <div class="rank-badge">
        🏆 Rank ${entry.rank} of ${totalParticipants}
      </div>

      <div class="stat-grid">
        <div class="stat">
          <div class="value">${entry.score.total_points}</div>
          <div class="label">Total points</div>
        </div>
        <div class="stat">
          <div class="value">${entry.score.exact_scores}</div>
          <div class="label">Exact scores</div>
        </div>
        <div class="stat">
          <div class="value">${Math.round(entry.score.accuracy_pct)}%</div>
          <div class="label">Accuracy</div>
        </div>
      </div>

      <p style="color:#6b7280; font-size:13px;">
        You've predicted <strong>${entry.score.exact_scores}</strong> exact scores and
        <strong>${entry.score.correct_results}</strong> correct results so far.
        ${entry.rank === 1 ? '🔥 You\'re in the lead — keep it up!' : `You're ${totalParticipants - entry.rank} place${totalParticipants - entry.rank === 1 ? '' : 's'} from the top!`}
      </p>

      <a href="${dashboardUrl}" class="cta">View the live leaderboard →</a>
    </div>
    <div class="footer">
      ICTU Football Madness • Sent automatically after match results update
    </div>
  </div>
</body>
</html>
  `

  await sendEmail({ to: participant.email, subject, html })
}

export async function sendAllStandingsEmails(
  leaderboard: LeaderboardEntry[],
  competitionName: string,
  appUrl: string
) {
  const results = []
  for (const entry of leaderboard) {
    if (!entry.participant.email) continue
    try {
      await sendStandingsEmail(
        { name: entry.participant.name, email: entry.participant.email },
        entry,
        leaderboard.length,
        competitionName,
        appUrl
      )
      results.push({ name: entry.participant.name, status: 'sent' })
    } catch (e: any) {
      results.push({ name: entry.participant.name, status: 'error', error: e.message })
    }
  }
  return results
}
