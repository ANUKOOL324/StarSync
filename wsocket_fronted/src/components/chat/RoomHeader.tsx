import { Info, Menu, Radio } from 'lucide-react'

import type { ChatRoom } from '../../types/chat'

type RoomHeaderProps = {
  connectionStatus: 'connecting' | 'online' | 'offline'
  room: ChatRoom
  onOpenSidebar: () => void
  onToggleInfo: () => void
}

export function RoomHeader({ connectionStatus, onOpenSidebar, onToggleInfo, room }: RoomHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/8 bg-black/24 px-3 backdrop-blur-md sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="grid size-9 place-items-center rounded-lg text-zinc-300 hover:bg-white/10 lg:hidden"
          aria-label="Open room menu"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">{room.name}</p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
            <Radio className="text-teal-300" size={12} aria-hidden="true" />
            <span className="capitalize">{connectionStatus === 'online' ? 'Live' : connectionStatus}</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleInfo}
        className="grid size-9 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white xl:hidden"
        aria-label="Toggle room info"
      >
        <Info size={18} aria-hidden="true" />
      </button>
    </header>
  )
}
