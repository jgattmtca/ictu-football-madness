'use client'
import { useState } from 'react'

export default function CoAdminPage() {
  const [competitionId] = useState('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
  const [message, setMessage] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [posting, setPosting] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [postMsg, setPostMsg] = useState('')

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch(`/api/scores/recalculate?competitionId=${competitionId}`, {
        method: 'POST',
      })
      if (res.ok || res.redirected) {
        setSyncMsg('✅ Scores synced successfully!')
      } else {
        setSyncMsg('❌ Sync failed. Try again.')
      }
    } catch {
      setSyncMsg('❌ Sync failed. Try again.')
    }
    setSyncing(false)
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setPosting(true)
    setPostMsg('')
    try {
      const res = await fetch('/api/admin/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, competitionId }),
      })
      if (res.ok) {
        setPostMsg('✅ Message posted!')
        setMessage('')
      } else {
        setPostMsg('❌ Failed to post. Try again.')
      }
    } catch {
      setPostMsg('❌ Failed to post. Try again.')
    }
    setPosting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-xl font-bold text-gray-900">ICTU Football Madness</h1>
          <p className="text-gray-400 text-sm mt-1">Co-admin panel</p>
        </div>

        {/* Sync scores */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-1">🔄 Sync scores</h2>
          <p className="text-gray-400 text-sm mb-4">
            Click after matches finish to update the leaderboard.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : '🔄 Sync scores now'}
          </button>
          {syncMsg && (
            <p className="text-sm mt-2 text-center text-gray-600">{syncMsg}</p>
          )}
        </div>

        {/* Message board */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-1">📣 Post a message</h2>
          <p className="text-gray-400 text-sm mb-4">
            Visible to everyone on the dashboard.
          </p>
          <form onSubmit={handlePost} className="space-y-3">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type something to taunt your colleagues... 😈"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
            />
            <button
              type="submit"
              disabled={posting || !message.trim()}
              className="w-full bg-purple-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {posting ? 'Posting…' : '📣 Post message'}
            </button>
          </form>
          {postMsg && (
            <p className="text-sm mt-2 text-center text-gray-600">{postMsg}</p>
          )}
        </div>

        {/* Dashboard link */}
        <div className="text-center">
          
            href="/dashboard/wc2026"
            className="text-green-600 text-sm hover:underline"
          >
            View leaderboard →
          </a>
        </div>
      </div>
    </div>
  )
}