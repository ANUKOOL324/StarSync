import { ChevronDown, ChevronRight } from 'lucide-react'

import type { ChatRoom, RoomMember } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

type DirectMessagesSectionProps = {
  activeRoomId: string
  dmRooms: ChatRoom[]
  error: string | null
  isDirectMessageRoom: boolean
  isLoadingMembers: boolean
  isOpen: boolean
  normalizedSearchQuery: string
  onCloseSidebar: () => void
  onCreateDm: (userId: string) => void
  onSelectRoom: (roomId: string) => void
  onToggle: () => void
  onlineUserIds: Set<string>
  openingDmUserId: string | null
  roomMembers: RoomMember[]
}

export function DirectMessagesSection({
  activeRoomId,
  dmRooms,
  error,
  isDirectMessageRoom,
  isLoadingMembers,
  isOpen,
  normalizedSearchQuery,
  onCloseSidebar,
  onCreateDm,
  onSelectRoom,
  onToggle,
  onlineUserIds,
  openingDmUserId,
  roomMembers,
}: DirectMessagesSectionProps) {
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight

  return (
    <section className="mt-4">
      <button type="button" onClick={onToggle} aria-expanded={isOpen} className="group flex w-full min-w-0 items-center gap-1.5 rounded-lg px-1 py-1 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-400 transition hover:bg-white/[0.055] hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35">
        <ChevronIcon size={14} aria-hidden="true" className="shrink-0 transition group-hover:text-[#18D6A3]" />
        <span className="truncate">Direct Messages</span>
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
                  <span className="block truncate text-sm font-semibold leading-5 text-slate-100">{otherUser?.username ?? 'Direct Message'}</span>
                  <span className="block truncate text-xs leading-4 text-slate-500">{isOtherOnline ? 'Online' : 'Offline'}</span>
                </span>
                {unreadCount ? <span className="min-w-5 rounded-full border border-white/10 bg-[#18D6A3] px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-[#03110E]">{unreadCount}</span> : null}
              </button>
            )
          })}

          {!isDirectMessageRoom && isLoadingMembers ? (
            <div className="grid gap-1.5">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex min-h-12 items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.025] px-2.5 py-2">
                  <span className="size-9 rounded-full bg-white/10" />
                  <span className="grid flex-1 gap-1.5"><span className="h-3 w-24 rounded-full bg-white/10" /><span className="h-2.5 w-16 rounded-full bg-white/[0.07]" /></span>
                </div>
              ))}
            </div>
          ) : null}

          {!isDirectMessageRoom && error ? <p className="rounded-xl border border-red-300/20 bg-red-950/20 px-3 py-3 text-sm text-red-200">{error}</p> : null}

          {!isDirectMessageRoom && !isLoadingMembers && !error ? roomMembers.map((member) => {
            const isOpening = openingDmUserId === member.id
            return (
              <button key={member.id} type="button" disabled={Boolean(openingDmUserId)} onClick={() => onCreateDm(member.id)} className="group relative flex min-h-12 w-full items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.04] px-2.5 py-2 text-left backdrop-blur-xl transition duration-150 hover:border-white/12 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35">
                <span className="relative shrink-0">
                  <Avatar name={member.username} seed={member.email} size="sm" />
                  <span className={['absolute bottom-0 right-0 size-2.5 rounded-full border border-[#05080A]', member.isOnline ? 'bg-[#22C55E]' : 'bg-slate-600'].join(' ')} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-5 text-slate-100">{member.username}</span>
                  <span className="block truncate text-xs leading-4 text-slate-500">{isOpening ? 'Opening...' : member.isOnline ? 'Online' : 'In this room'}</span>
                </span>
              </button>
            )
          }) : null}

          {!dmRooms.length && !isDirectMessageRoom && !isLoadingMembers && !error && !roomMembers.length ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm leading-5 text-slate-400 backdrop-blur-xl">
              {normalizedSearchQuery ? 'No matching conversations.' : 'No direct messages yet.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
