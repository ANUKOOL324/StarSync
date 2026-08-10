import { ChevronDown, ChevronRight } from 'lucide-react'

import type { ChatRoom } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

type DirectMessagesSectionProps = {
  activeRoomId: string
  dmRooms: ChatRoom[]
  isOpen: boolean
  normalizedSearchQuery: string
  onCloseSidebar: () => void
  onSelectRoom: (roomId: string) => void
  onToggle: () => void
}

export function DirectMessagesSection({
  activeRoomId,
  dmRooms,
  isOpen,
  normalizedSearchQuery,
  onCloseSidebar,
  onSelectRoom,
  onToggle,
}: DirectMessagesSectionProps) {
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight

  return (
    <section className="mt-4">
      <button type="button" onClick={onToggle} aria-expanded={isOpen} className="group flex w-full min-w-0 items-center gap-1.5 rounded-lg px-1 py-1 text-left transition hover:bg-white/[0.055] hover:text-slate-200 focus:outline-none">
        <ChevronIcon size={14} aria-hidden="true" className="shrink-0 transition group-hover:text-[#18D6A3]" />
        <span className="room-font-kicker truncate text-xs text-slate-400">Direct Messages</span>
      </button>

      {isOpen ? (
        <div className="mt-1.5 grid gap-1.5">
          {dmRooms.map((dmRoom) => {
            const isActiveDm = dmRoom.id === activeRoomId
            const otherUser = dmRoom.otherUser
            const unreadCount = !isActiveDm ? (dmRoom.unreadCount ?? 0) : 0

            return (
              <button
                key={dmRoom.id}
                type="button"
                onClick={() => {
                  onSelectRoom(dmRoom.id)
                  if (window.innerWidth < 1280) onCloseSidebar()
                }}
                className={[
                  'group relative flex h-12 w-full items-center gap-2.5 rounded-xl border px-2.5 text-left backdrop-blur-xl transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35',
                  isActiveDm
                    ? 'border-[#18D6A3]/28 bg-[#18D6A3]/9 shadow-[0_10px_28px_rgba(24,214,163,0.10)]'
                    : 'border-white/8 bg-white/[0.04] hover:border-white/12 hover:bg-white/[0.07]',
                ].join(' ')}
              >
                {isActiveDm ? <span className="pointer-events-none absolute inset-y-2 left-0 w-px rounded-full bg-[#18D6A3]/70 shadow-[0_0_14px_rgba(24,214,163,0.45)]" /> : null}
                <Avatar name={otherUser?.username ?? 'DM'} seed={otherUser?.email ?? dmRoom.id} size="sm" className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="room-font-display block truncate text-sm font-semibold leading-5 text-slate-100">
                    {otherUser?.username ?? 'Direct Message'}
                  </span>
                </span>
                {unreadCount ? (
                  <span className="min-w-5 shrink-0 rounded-full border border-white/10 bg-[#18D6A3] px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-[#03110E]">
                    {unreadCount}
                  </span>
                ) : null}
              </button>
            )
          })}

          {!dmRooms.length ? (
            normalizedSearchQuery ? (
              <p className="room-font-body px-1 py-1 text-xs text-slate-500">No matching conversations.</p>
            ) : (
              <p className="room-font-body rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm leading-5 text-slate-400 backdrop-blur-xl">
                No direct messages yet.
              </p>
            )
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
