'use client'
import { useState, useRef } from 'react'
import { cookies } from 'next/headers'

interface UploadResult {
  filename: string
  participant: string
  predictions: number
  status: 'success' | 'error'
  error?: string
}

export default function UploadPage() {
  const [competitionId, setCompetitionId] = useState('')
  const [competitions, setCompetitions] = useState<any[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<UploadResult[]>([])
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load competitions on mount
  useState(() => {
    fetch('/api/admin/competitions')
      .then(r => r.json())
      .then(d => {
        setCompetitions(d.competitions || [])
        const active = d.competitions?.find((c: any) => c.is_active)
        if (active) setCompetitionId(active.id)
      })
  })

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    )
    setFiles(prev => [...prev, ...dropped])
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selected])
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (!competitionId || files.length === 0) return
    setLoading(true)
    setResults([])

    const uploadResults: UploadResult[] = []

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('competitionId', competitionId)

      try {
        const res = await fetch('/api/admin/upload-predictions', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        uploadResults.push({
          filename: file.name,
          participant: data.participant || file.name,
          predictions: data.predictionsImported || 0,
          status: res.ok ? 'success' : 'error',
          error: data.error,
        })
      } catch (e: any) {
        uploadResults.push({
          filename: file.name,
          participant: file.name,
          predictions: 0,
          status: 'error',
          error: e.message,
        })
      }
    }

    setResults(uploadResults)
    setLoading(false)
    if (uploadResults.every(r => r.status === 'success')) setFiles([])
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Upload predictions</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload each participant's completed Excel file. Name the files
          <code className="bg-gray-100 px-1 rounded text-xs mx-1">Group_Stage_Predictions_PlayerName.xlsx</code>
          — the player name is extracted automatically.
        </p>
      </div>

      {/* Competition selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Competition</label>
        <select
          value={competitionId}
          onChange={e => setCompetitionId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select a competition…</option>
          {competitions.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="text-3xl mb-3">📤</div>
        <p className="font-medium text-gray-700">Drop Excel files here or click to browse</p>
        <p className="text-sm text-gray-400 mt-1">Multiple files supported — one per participant</p>
      </div>

      {/* Queued files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">{files.length} file{files.length > 1 ? 's' : ''} ready to upload:</p>
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-green-600">📄</span>
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeFile(i) }}
                className="text-gray-400 hover:text-red-500 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={loading || !competitionId}
            className="mt-3 w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Importing…' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-gray-700">Upload results:</p>
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${
                r.status === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{r.status === 'success' ? '✅' : '❌'}</span>
                <span className="font-medium">{r.participant}</span>
              </div>
              <span className="text-xs">
                {r.status === 'success'
                  ? `${r.predictions} predictions imported`
                  : r.error}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
