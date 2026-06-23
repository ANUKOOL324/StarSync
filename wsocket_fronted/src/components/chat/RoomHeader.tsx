import { Info, Settings } from 'lucide-react'

import type { ChatRoom } from '../../types/chat'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { Avatar, AvatarGroup, AvatarGroupCount } from '../ui/Avatar'

type RoomHeaderProps = {
  activeCollaborators?: { id: string; username: string; email: string }[]
  connectionStatus: 'connecting' | 'online' | 'offline'
  isInfoOpen: boolean
  room: ChatRoom
  onOpenSettings: () => void
  onToggleInfo: () => void
}

export function RoomHeader({
  activeCollaborators,
  connectionStatus,
  isInfoOpen,
  onOpenSettings,
  onToggleInfo,
  room,
}: RoomHeaderProps) {
  const liveStatusText = connectionStatus === 'online' ? 'Live' : connectionStatus
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

          <div className="min-w-0 flex-1 sm:flex-initial">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <p className="truncate text-base font-semibold text-slate-100 sm:text-lg">
                {roomDisplay.displayName}
              </p>

              {activeCollaborators !== undefined && activeCollaborators.length > 0 && (
                <div
                  className="flex items-center shrink-0"
                  title={`${activeCollaborators.length} active user${activeCollaborators.length === 1 ? '' : 's'}`}
                >
                  {activeCollaborators.length === 1 ? (
                    <div className="flex h-8 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-2.5">
                      <Avatar
                        name={activeCollaborators[0].username}
                        seed={activeCollaborators[0].username || activeCollaborators[0].email}
                        size="xs"
                      />
                      <span className="text-xs text-slate-300 font-medium">1 active</span>
                    </div>
                  ) : (
                    <AvatarGroup className="*:data-[slot=avatar]:ring-[#05080a] *:data-[slot=avatar]:ring-2">
                      {activeCollaborators.slice(0, 3).map((collaborator) => (
                        <Avatar
                          key={collaborator.id}
                          name={collaborator.username}
                          seed={collaborator.username || collaborator.email}
                          size="xs"
                        />
                      ))}
                      <AvatarGroupCount className="size-7 text-[10px] bg-[#18181B] text-slate-300 ring-2 ring-[#05080a] border-none">
                        +{activeCollaborators.length}
                      </AvatarGroupCount>
                    </AvatarGroup>
                  )}
                </div>
              )}
            </div>
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

          <button
            type="button"
            onClick={onOpenSettings}
            className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40 cursor-pointer"
            aria-label="Open room settings"
          >
            <Settings size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onToggleInfo}
            className={[
              'grid size-9 place-items-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40 cursor-pointer',
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
