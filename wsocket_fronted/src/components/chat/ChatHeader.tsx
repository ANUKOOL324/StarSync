import { Info, Menu, Radio } from 'lucide-react'

import type { ChatRoom } from '../../types/chat'

type ChatHeaderProps = {
  connectionStatus: 'connecting' | 'online' | 'offline'
  room: ChatRoom
  onOpenSidebar: () => void
  onToggleInfo: () => void
}

export function ChatHeader({ connectionStatus, onOpenSidebar, onToggleInfo, room }: ChatHeaderProps) {
  const statusText = connectionStatus === 'online' ? 'Live' : connectionStatus

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-black/28 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="grid size-10 place-items-center rounded-lg text-zinc-300 hover:bg-white/10 lg:hidden"
          aria-label="Open room menu"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-white">{room.name}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
            <Radio className="text-teal-300" size={13} aria-hidden="true" />
            <span className="capitalize">{statusText}</span>
            <span className="hidden sm:inline">- {room.description}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleInfo}
        className="grid size-10 place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/10 hover:text-white xl:hidden"
        aria-label="Toggle room info"
      >
        <Info size={18} aria-hidden="true" />
      </button>
    </header>
  )
}
