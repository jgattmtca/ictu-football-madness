'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Props { competitions: any[] }

export default function AdminDashboard({ competitions }: Props) {
  const cards = [
    { href: '/admin/competitions', icon: '🏆', label: 'Competitions', desc: 'Create & manage tournaments' },
    { href: '/admin/upload', icon: '📤', label: 'Upload predictions', desc: 'Import participant Excel files' },
    { href: '/admin/participants', icon: '👥', label: 'Participants', desc: 'Manage players & avatars' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">⚽ ICTU Football Madness</h1>
        <p className="text-gray-500 mt-1">Admin dashboard ⚽</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-400 hover:shadow-sm transition-all group"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <div className="font-semibold text-gray-800 group-hover:text-green-700">{card.label}</div>
            <div className="text-sm text-gray-400 mt-1">{card.desc}</div>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Competitions</h2>
        {competitions.length > 0 ? (
          <div className="space-y-3">
            {competitions.map((comp: any) => (
              <CompetitionCard key={comp.id} comp={comp} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-400">No competitions yet.</p>
            <Link href="/admin/competitions" className="text-green-600 text-sm mt-2 inline-block hover:underline">
              Create your first competition →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function CompetitionCard({ comp }: { comp: any }) {
  const [message, setMessage] = useState('')
  const [postMsg, setPostMsg] = useState('')

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    const res = await fetch('/api/admin/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, competitionId: comp.id }),
    })
    if (res.ok) {
      setPostMsg('✅ Message posted!')
      setMessage('')
    } else {
      setPostMsg('❌ Failed to post.')
    }
  }

  async function handleDelete() {
    const res = await fetch('/api/admin/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', competitionId: comp.id }),
    })
    if (res.ok) {
      setMessage('')
      setPostMsg('🗑️ Message cleared!')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{comp.name}</span>
            {comp.is_active && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            /{comp.slug} · {comp.participants?.[0]?.count ?? 0} participants
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${comp.slug}`}
            target="_blank"
            className="text-xs text-green-600 hover:underline"
          >
            View dashboard ↗
          </Link>
          <form action={`/api/email/send?competitionId=${comp.id}`} method="POST">
            <button type="submit" className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
              📧 Email standings
            </button>
          </form>
          <form action={`/api/scores/recalculate?competitionId=${comp.id}`} method="POST">
            <button type="submit" className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
              🔄 Sync scores
            </button>
          </form>
        </div>
      </div>

      <form onSubmit={handlePost} className="mt-2">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message for all participants... 😈"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          rows={2}
        />
        <div className="flex gap-2 mt-1">
          <button
            type="submit"
            disabled={!message.trim()}
            className="flex-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            📣 Post message
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
          >
            🗑️
          </button>
        </div>
      </form>
      {postMsg && <p className="text-xs mt-1 text-gray-500">{postMsg}</p>}
    </div>
  )
}