'use client'
import { useState, useEffect, useRef } from 'react'

interface Participant {
  id: string; name: string; email: string | null; avatar_url: string | null
  avatar_initials: string; avatar_color: string; paid_jackpot: boolean
  competition_id: string
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [competitions, setCompetitions] = useState<any[]>([])
  const [competitionId, setCompetitionId] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState<string | null>(null)
  const [savingEmail, setSavingEmail] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch('/api/admin/competitions')
      .then(r => r.json())
      .then(d => {
        setCompetitions(d.competitions || [])
        const active = d.competitions?.find((c: any) => c.is_active)
        if (active) {
          setCompetitionId(active.id)
          loadParticipants(active.id)
        }
      })
  }, [])

  function loadParticipants(cid: string) {
    fetch(`/api/admin/participants?competitionId=${cid}`)
      .then(r => r.json())
      .then(d => setParticipants(d.participants || []))
  }

  async function handleAvatarUpload(participantId: string, file: File) {
    setUploadingAvatar(participantId)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('participantId', participantId)

    const res = await fetch('/api/admin/avatar', { method: 'POST', body: formData })
    const data = await res.json()
    if (res.ok) {
      setParticipants(p => p.map(x => x.id === participantId ? { ...x, avatar_url: data.avatarUrl } : x))
      setMsg('Avatar updated!')
    }
    setUploadingAvatar(null)
  }

  async function handleEmailChange(participantId: string, email: string) {
    setSavingEmail(participantId)
    await fetch(`/api/admin/participants/${participantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setParticipants(p => p.map(x => x.id === participantId ? { ...x, email } : x))
    setSavingEmail(null)
  }

  async function toggleJackpot(participantId: string, current: boolean) {
    await fetch(`/api/admin/participants/${participantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid_jackpot: !current }),
    })
    setParticipants(p => p.map(x => x.id === participantId ? { ...x, paid_jackpot: !current } : x))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Participants</h1>
          <p className="text-gray-500 text-sm mt-1">Manage players, avatars & emails</p>
        </div>
        <select
          value={competitionId}
          onChange={e => { setCompetitionId(e.target.value); loadParticipants(e.target.value) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {msg && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg flex items-center justify-between">
          {msg}
          <button onClick={() => setMsg('')} className="text-green-500">×</button>
        </div>
      )}

      {participants.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
          <p className="text-gray-400">No participants yet for this competition.</p>
          <p className="text-sm text-gray-400 mt-1">Upload prediction files to add participants automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {participants.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: p.avatar_color }}
                    onClick={() => fileRefs.current[p.id]?.click()}
                    title="Click to change photo"
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      p.avatar_initials
                    )}
                  </div>
                  {uploadingAvatar === p.id && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">…</span>
                    </div>
                  )}
                  <input
                    ref={el => fileRefs.current[p.id] = el}
                    type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleAvatarUpload(p.id, file)
                    }}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center cursor-pointer"
                    onClick={() => fileRefs.current[p.id]?.click()}>
                    <span className="text-white text-[8px]">✎</span>
                  </div>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <EmailInput
                    email={p.email || ''}
                    saving={savingEmail === p.id}
                    onSave={email => handleEmailChange(p.id, email)}
                  />
                </div>

                {/* Jackpot toggle */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => toggleJackpot(p.id, p.paid_jackpot)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      p.paid_jackpot
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    {p.paid_jackpot ? '💰 Paid €5' : '💸 Not paid'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmailInput({ email, saving, onSave }: { email: string; saving: boolean; onSave: (e: string) => void }) {
  const [value, setValue] = useState(email)
  const [editing, setEditing] = useState(false)

  return editing ? (
    <div className="flex items-center gap-1 mt-0.5">
      <input
        type="email" value={value} onChange={e => setValue(e.target.value)}
        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') { onSave(value); setEditing(false) } }}
      />
      <button onClick={() => { onSave(value); setEditing(false) }}
        className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
        {saving ? '…' : '✓'}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-gray-400 px-1">✕</button>
    </div>
  ) : (
    <button onClick={() => setEditing(true)}
      className="text-xs text-gray-400 hover:text-green-600 mt-0.5 text-left">
      {email || '+ Add email'}
    </button>
  )
}
