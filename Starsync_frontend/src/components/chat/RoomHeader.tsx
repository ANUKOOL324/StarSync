import { Info, Menu, Settings } from 'lucide-react'

import type { ChatRoom } from '../../types/chat'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { Avatar, AvatarGroup, AvatarGroupCount } from '../ui/Avatar'

type RoomHeaderProps = {
  activeCollaborators?: { id: string; username: string; email: string }[]
  connectionStatus: 'connecting' | 'online' | 'offline'
  dmPeerIsOnline?: boolean
  isInfoOpen: boolean
  room: ChatRoom
  onOpenSettings: () => void
  onOpenSidebar?: () => void
  onToggleInfo: () => void
  showSettings?: boolean
}

export function RoomHeader({
  activeCollaborators,
  connectionStatus,
  dmPeerIsOnline = false,
  isInfoOpen,
  onOpenSettings,
  onOpenSidebar,
  onToggleInfo,
  room,
  showSettings = true,
}: RoomHeaderProps) {
  const liveStatusText = connectionStatus === 'online' ? 'Live' : connectionStatus
  const isOnline = connectionStatus === 'online'
  const roomDisplay = getRoomDisplayInfo(room)
  const isDirectMessage = room.type === 'DM'

  return (
    <header className="z-20 shrink-0 border-b border-white/10 bg-[#05080A]/90 px-3 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-5">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {onOpenSidebar ? (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-slate-300 transition hover:border-[#18D6A3]/25 hover:bg-[#18D6A3]/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40 xl:hidden cursor-pointer"
              aria-label="Open room sidebar"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
          ) : null}
          <Avatar
            name={roomDisplay.avatarName}
            seed={roomDisplay.avatarSeed}
            type={roomDisplay.isDirectMessage ? 'user' : 'room'}
            size="lg"
          />

          <div className="min-w-0 flex-1 sm:flex-initial">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <div className="min-w-0">
                <p className="room-font-display truncate text-base font-semibold text-slate-100 sm:text-lg">
                  {roomDisplay.displayName}
                </p>

                {isDirectMessage && dmPeerIsOnline ? (
                  <span className="mt-0.5 inline-flex h-5 items-center justify-center gap-1.5 rounded-full border border-[#22C55E]/25 bg-[#22C55E]/10 px-2 text-[11px] font-medium leading-none text-[#86EFAC]">
                    <span className="size-1.5 shrink-0 rounded-full bg-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.55)]" aria-hidden="true" />
                    active
                  </span>
                ) : null}
              </div>

              {activeCollaborators !== undefined && activeCollaborators.length > 0 && (
                <div
                  className="flex items-center shrink-0"
                  title={`${activeCollaborators.length} active user${activeCollaborators.length === 1 ? '' : 's'}`}
                >
                  {activeCollaborators.length === 1 ? (
                    <div className="flex h-6 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.035] px-2">
                      <Avatar
                        name={activeCollaborators[0].username}
                        seed={activeCollaborators[0].username || activeCollaborators[0].email}
                        size="xs"
                        className="!size-5"
                      />
                      <span className="text-[10px] font-medium leading-none text-slate-300">1 active</span>
                    </div>
                  ) : (
                    <AvatarGroup className="*:data-[slot=avatar]:ring-[#05080a] *:data-[slot=avatar]:ring-2">
                      {activeCollaborators.slice(0, 3).map((collaborator) => (
                        <Avatar
                          key={collaborator.id}
                          name={collaborator.username}
                          seed={collaborator.username || collaborator.email}
                          size="xs"
                          className="!size-6"
                        />
                      ))}
                      <AvatarGroupCount className="size-6 text-[9px] bg-[#18181B] text-slate-300 ring-2 ring-[#05080a] border-none">
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
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-2 py-1 text-[11px] text-slate-300 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
            <span
              className={[
                'size-1.5 rounded-full',
                isOnline ? 'bg-[#22C55E] shadow-[0_0_12px_rgba(34,197,94,0.65)]' : 'bg-slate-500',
              ].join(' ')}
              aria-hidden="true"
            />
            <span className="capitalize">{liveStatusText}</span>
          </div>

          {showSettings ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40 cursor-pointer"
              aria-label="Open room settings"
            >
              <Settings size={18} aria-hidden="true" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onToggleInfo}
            className={[
              'grid size-9 place-items-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40 cursor-pointer',
              isInfoOpen
                ? 'border border-[#18D6A3]/25 bg-[#18D6A3]/10 text-[#7FFFE0] shadow-sm shadow-[#18D6A3]/10'
                : 'border border-transparent text-slate-400 hover:bg-white/10 hover:text-white',
            ].join(' ')}
            aria-label={isDirectMessage ? 'Toggle conversation details' : 'Toggle room details'}
            aria-expanded={isInfoOpen}
          >
            <Info size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
