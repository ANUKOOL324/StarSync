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
  onlineUserIds: Set<string>
}

export function DirectMessagesSection({
  activeRoomId,
  dmRooms,
  isOpen,
  normalizedSearchQuery,
  onCloseSidebar,
  onSelectRoom,
  onToggle,
  onlineUserIds,
}: DirectMessagesSectionProps) {
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight

  return (
    <section className="mt-4">
      <button type="button" onClick={onToggle} aria-expanded={isOpen} className="group flex w-full min-w-0 items-center gap-1.5 rounded-lg px-1 py-1 text-left transition hover:bg-white/[0.055] hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35">
        <ChevronIcon size={14} aria-hidden="true" className="shrink-0 transition group-hover:text-[#18D6A3]" />
        <span className="room-font-kicker truncate text-xs text-slate-400">Direct Messages</span>
      </button>

      {isOpen ? (
        <div className="mt-1.5 grid gap-1.5">
          {dmRooms.map((dmRoom) => {
            const isActiveDm = dmRoom.id === activeRoomId
            const otherUser = dmRoom.otherUser
            const isOtherOnline = otherUser ? onlineUserIds.has(otherUser.id) : false
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
                  'group relative flex min-h-12 w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left backdrop-blur-xl transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35',
                  isActiveDm
                    ? 'border-[#18D6A3]/28 bg-[#18D6A3]/9 shadow-[0_10px_28px_rgba(24,214,163,0.10)]'
                    : 'border-white/8 bg-white/[0.04] hover:border-white/12 hover:bg-white/[0.07]',
                ].join(' ')}
              >
                {isActiveDm ? <span className="pointer-events-none absolute inset-y-2 left-0 w-px rounded-full bg-[#18D6A3]/70 shadow-[0_0_14px_rgba(24,214,163,0.45)]" /> : null}
                <span className="relative shrink-0">
                  <Avatar name={otherUser?.username ?? 'DM'} seed={otherUser?.email ?? dmRoom.id} size="sm" />
                  <span className={['absolute bottom-0 right-0 size-2.5 rounded-full border border-[#05080A]', isOtherOnline ? 'bg-[#22C55E]' : 'bg-slate-600'].join(' ')} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="room-font-display block truncate text-sm font-semibold leading-5 text-slate-100">{otherUser?.username ?? 'Direct Message'}</span>
                  <span className="room-font-body block truncate text-xs leading-4 text-slate-500">{isOtherOnline ? 'Online' : 'Offline'}</span>
                </span>
                {unreadCount ? <span className="min-w-5 rounded-full border border-white/10 bg-[#18D6A3] px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-[#03110E]">{unreadCount}</span> : null}
              </button>
            )
          })}

          {!dmRooms.length ? (
            <p className="room-font-body rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm leading-5 text-slate-400 backdrop-blur-xl">
              {normalizedSearchQuery ? 'No matching conversations.' : 'No direct messages yet.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
