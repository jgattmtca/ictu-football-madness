'use client'
import { useState, useEffect } from 'react'

interface Competition {
  id: string; name: string; slug: string; is_active: boolean
  start_date: string; scoring: any
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', slug: '', start_date: '', end_date: '',
    scoring_exact: 5, scoring_result: 3, scoring_winner: 10, scoring_boot: 10,
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/competitions')
      .then(r => r.json())
      .then(d => setCompetitions(d.competitions || []))
  }, [])

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setForm(f => ({ ...f, name, slug }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/competitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        start_date: form.start_date,
        end_date: form.end_date,
        scoring: {
          exact_score: form.scoring_exact,
          correct_result: form.scoring_result,
          tournament_winner: form.scoring_winner,
          golden_boot: form.scoring_boot,
        },
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setCompetitions(c => [data.competition, ...c])
      setShowForm(false)
      setMsg('Competition created!')
    } else {
      setMsg(data.error || 'Error creating competition')
    }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/competitions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    setCompetitions(c => c.map(x => x.id === id ? { ...x, is_active: !current } : x))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Competitions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your tournaments</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + New competition
        </button>
      </div>

      {msg && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">{msg}</div>}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800">New competition</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                required value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="World Cup 2026"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URL slug</label>
              <input
                required value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="wc2026"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Scoring rules (points)</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: 'scoring_exact', label: 'Exact score' },
                { key: 'scoring_result', label: 'Correct result' },
                { key: 'scoring_winner', label: 'Tournament winner' },
                { key: 'scoring_boot', label: 'Golden boot' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    type="number" min={0} max={100}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create competition'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-gray-500 px-5 py-2 rounded-lg text-sm hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Competition list */}
      <div className="space-y-3">
        {competitions.map(comp => (
          <div key={comp.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{comp.name}</span>
                  {comp.is_active && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  /dashboard/{comp.slug}
                  {comp.start_date && ` · Starts ${new Date(comp.start_date).toLocaleDateString()}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/dashboard/${comp.slug}`} target="_blank"
                  className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">
                  View ↗
                </a>
                <button
                  onClick={() => toggleActive(comp.id, comp.is_active)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    comp.is_active
                      ? 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  }`}
                >
                  {comp.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
