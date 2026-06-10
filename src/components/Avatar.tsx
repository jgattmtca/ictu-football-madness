import Image from 'next/image'
import { Participant } from '@/types'

interface Props {
  participant: Participant
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLeader?: boolean
}

const sizes = {
  sm:  { px: 32,  text: 'text-xs',  crown: 'text-sm top-[-10px]' },
  md:  { px: 44,  text: 'text-sm',  crown: 'text-base top-[-14px]' },
  lg:  { px: 56,  text: 'text-base', crown: 'text-xl top-[-18px]' },
  xl:  { px: 72,  text: 'text-xl',  crown: 'text-2xl top-[-22px]' },
}

export default function Avatar({ participant, size = 'md', isLeader = false }: Props) {
  const { px, text, crown } = sizes[size]

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: px }}>
      {isLeader && (
        <span
          className={`absolute ${crown} animate-crown-float z-10 select-none`}
          style={{ fontSize: sizes[size].px * 0.4 }}
          aria-label="leader"
        >
          👑
        </span>
      )}
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0 ${
          isLeader ? 'leader-glow animate-pulse-glow' : ''
        }`}
        style={{
          width: px,
          height: px,
          backgroundColor: participant.avatar_color || '#15803d',
        }}
      >
        {participant.avatar_url ? (
          <Image
            src={participant.avatar_url}
            alt={participant.name}
            width={px}
            height={px}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className={text}>{participant.avatar_initials}</span>
        )}
      </div>
    </div>
  )
}
