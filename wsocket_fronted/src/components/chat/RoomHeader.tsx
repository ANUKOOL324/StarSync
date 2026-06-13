import { Info, Settings } from 'lucide-react'

import type { ChatRoom } from '../../types/chat'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { Avatar } from '../ui/Avatar'

type RoomHeaderProps = {
  connectionStatus: 'connecting' | 'online' | 'offline'
  isAdmin?: boolean
  isInfoOpen: boolean
  memberCount: number
  room: ChatRoom
  onOpenSettings: () => void
  onToggleInfo: () => void
}

export function RoomHeader({
  connectionStatus,
  isAdmin,
  isInfoOpen,
  memberCount,
  onOpenSettings,
  onToggleInfo,
  room,
}: RoomHeaderProps) {
  const liveStatusText = connectionStatus === 'online' ? 'Live' : connectionStatus
  const memberLabel = memberCount === 1 ? 'member' : 'members'
  const isOnline = connectionStatus === 'online'
  const roomDisplay = getRoomDisplayInfo(room)

  return (
    <header className="z-20 shrink-0 border-b border-white/10 bg-[#05080A]/90 px-3 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-5">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Avatar
            name={roomDisplay.avatarName}
            seed={roomDisplay.avatarSeed}
            type={roomDisplay.isDirectMessage ? 'user' : 'room'}
            size="lg"
          />

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-base font-semibold text-slate-100 sm:text-lg">
                {roomDisplay.displayName}
              </p>
              {isAdmin && !roomDisplay.isDirectMessage ? (
                <span className="hidden shrink-0 rounded-full border border-[#18D6A3]/25 bg-[#18D6A3]/10 px-2 py-0.5 text-[11px] font-medium text-[#7FFFE0] sm:inline-flex">
                  Admin
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-slate-500">{roomDisplay.subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-slate-300 sm:flex">
            <span
              className={[
                'size-1.5 rounded-full',
                isOnline ? 'bg-[#22C55E] shadow-[0_0_12px_rgba(34,197,94,0.65)]' : 'bg-slate-500',
              ].join(' ')}
              aria-hidden="true"
            />
            <span className="capitalize">{liveStatusText}</span>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-slate-300 md:block">
            {memberCount} / {room.maxMembers ?? 'Unlimited'} {memberLabel}
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40"
            aria-label="Open room settings"
          >
            <Settings size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onToggleInfo}
            className={[
              'grid size-9 place-items-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40',
              isInfoOpen
                ? 'border border-[#18D6A3]/25 bg-[#18D6A3]/10 text-[#7FFFE0] shadow-sm shadow-[#18D6A3]/10'
                : 'border border-transparent text-slate-400 hover:bg-white/10 hover:text-white',
            ].join(' ')}
            aria-label="Toggle room details"
            aria-expanded={isInfoOpen}
          >
            <Info size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
