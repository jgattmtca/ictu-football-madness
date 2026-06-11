'use client'
import { Competition } from '@/types'
import Link from 'next/link'

interface Props { competition: Competition }

export default function CompetitionHeader({ competition }: Props) {
  return (
    <header className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚽</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">{competition.name}</h1>
            <p className="text-green-400/70 text-xs">ICTU Football Madness</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {competition.is_active && (
            <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/50 border border-green-700/50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
          <Link
            href="/admin"
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Admin ⚙️
          </Link>
        </div>
      </div>
    </header>
  )
}