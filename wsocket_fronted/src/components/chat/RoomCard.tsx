import { motion } from 'framer-motion'

import type { ChatRoom } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

type RoomCardProps = {
  room: ChatRoom
  isActive: boolean
  onSelect: (roomId: string) => void
}

const formatRelativeTime = (value?: string) => {
  if (!value) return 'Recently'

  const createdAt = new Date(value).getTime()
  const now = Date.now()
  const diffInMinutes = Math.max(Math.floor((now - createdAt) / 60000), 0)

  if (diffInMinutes < 1) return 'Now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

export function RoomCard({ isActive, onSelect, room }: RoomCardProps) {
  const unreadCount = !isActive ? room.unreadCount ?? 0 : 0

  return (
    <motion.button
      type="button"
      whileHover={{ x: 2 }}
      transition={{ duration: 0.14 }}
      onClick={() => onSelect(room.id)}
      className={[
        'group relative w-full overflow-hidden rounded-xl border px-2.5 py-2 text-left backdrop-blur-xl transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35',
        isActive
          ? 'border-[#18D6A3]/28 bg-[#18D6A3]/9 shadow-[0_10px_28px_rgba(24,214,163,0.10)]'
          : 'border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.045]',
      ].join(' ')}
    >
      {isActive ? (
        <span className="pointer-events-none absolute inset-y-2 left-0 w-px rounded-full bg-[#18D6A3]/70 shadow-[0_0_14px_rgba(24,214,163,0.45)]" />
      ) : null}

      {unreadCount ? (
        <span className="absolute right-2.5 top-2.5 min-w-5 rounded-full border border-white/10 bg-[#18D6A3] px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-[#03110E] shadow shadow-[#18D6A3]/20">
          {unreadCount}
        </span>
      ) : null}

      <div className="flex min-h-12 items-center gap-2.5 pr-7">
        <Avatar name={room.name} seed={room.joinCode ?? room.slug} type="room" size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-5 text-slate-100">{room.name}</span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs leading-4 text-slate-500">
            <span className="truncate text-slate-400">{room.joinCode ?? 'No code'}</span>
            <span className="shrink-0 text-slate-600">/</span>
            <span className="shrink-0">{formatRelativeTime(room.createdAt)}</span>
          </span>
        </span>
      </div>
    </motion.button>
  )
}
