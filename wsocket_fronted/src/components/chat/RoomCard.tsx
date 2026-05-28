import { Hash } from 'lucide-react'
import { motion } from 'framer-motion'

import type { ChatRoom } from '../../types/chat'

type RoomCardProps = {
  room: ChatRoom
  isActive: boolean
  onSelect: (roomId: string) => void
}

export function RoomCard({ isActive, onSelect, room }: RoomCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ x: 1 }}
      onClick={() => onSelect(room.id)}
      className={[
        'group w-full rounded-lg border px-2.5 py-2 text-left transition',
        isActive
          ? 'border-teal-200/35 bg-teal-300/12 shadow-lg shadow-teal-500/10'
          : 'border-transparent bg-transparent hover:border-white/10 hover:bg-white/6',
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={[
            'grid size-8 place-items-center rounded-lg',
            isActive ? 'bg-teal-300 text-zinc-950' : 'bg-white/7 text-zinc-400',
          ].join(' ')}
        >
          <Hash size={14} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{room.name}</span>
          <span className="block truncate text-xs text-zinc-500">{room.description}</span>
        </span>
        {room.unreadCount ? (
          <span className="rounded-full bg-teal-300 px-2 py-0.5 text-xs font-bold text-zinc-950">
            {room.unreadCount}
          </span>
        ) : null}
      </div>
    </motion.button>
  )
}
