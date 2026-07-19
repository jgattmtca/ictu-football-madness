'use client'

export default function FinalHeader() {
  return (
    <div className="relative overflow-hidden" style={{ height: '200px' }}>
      {/* Gold radial background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, #92651a 0%, #3d2a00 40%, #1a1200 100%)'
      }} />

      {/* Spain flag — left side */}
      <div className="absolute left-0 top-0 bottom-0" style={{ width: '260px' }}>
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1" style={{ background: '#c60b1e' }} />
          <div style={{ flex: 2, background: '#ffc400' }} />
          <div className="flex-1" style={{ background: '#c60b1e' }} />
        </div>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to right, transparent 0%, transparent 70%, #1a1200 100%)'
        }} />
      </div>

      {/* Argentina flag — right side */}
      <div className="absolute right-0 top-0 bottom-0" style={{ width: '260px' }}>
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1" style={{ background: '#74acdf' }} />
          <div className="flex-1" style={{ background: '#ffffff' }} />
          <div className="flex-1" style={{ background: '#74acdf' }} />
        </div>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to left, transparent 0%, transparent 70%, #1a1200 100%)'
        }} />
      </div>

      {/* Centre content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <p className="text-xs font-medium tracking-widest mb-2" style={{ color: '#fbbf24', letterSpacing: '0.3em' }}>
          WORLD CUP 2026
        </p>
        <h1 className="font-black tracking-widest mb-3" style={{
          color: '#fde68a',
          fontSize: '3rem',
          letterSpacing: '0.15em',
          textShadow: '0 0 30px rgba(251,191,36,0.4)'
        }}>
          🏆 SPAIN
        </h1>
        <p className="font-bold text-lg" style={{ color: '#fb923c', letterSpacing: '0.15em' }}>
          WORLD CHAMPIONS 2026
        </p>
      </div>

      {/* Country labels at bottom */}
      <div className="absolute bottom-3 left-0 z-10" style={{ width: '260px' }}>
        <p className="text-center text-xs font-bold tracking-widest" style={{ color: '#fde68a', letterSpacing: '0.2em' }}>
          🇪🇸 SPAIN
        </p>
      </div>
      <div className="absolute bottom-3 right-0 z-10" style={{ width: '260px' }}>
        <p className="text-center text-xs font-bold tracking-widest" style={{ color: '#fde68a', letterSpacing: '0.2em' }}>
          ARGENTINA 🇦🇷
        </p>
      </div>
    </div>
  )
}