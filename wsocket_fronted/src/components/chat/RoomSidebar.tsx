import { LogOut, Menu, MessageCircle, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import type { AuthUser } from '../../types/auth'
import type { ChatRoom } from '../../types/chat'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { RoomCard } from './RoomCard'

type RoomSidebarProps = {
  activeRoomId: string
  isOpen: boolean
  onCloseMobile: () => void
  onCreateRoom: () => void
  onLogout: () => void
  onSelectRoom: (roomId: string) => void
  rooms: ChatRoom[]
  user: AuthUser | null
}

export function RoomSidebar({
  activeRoomId,
  isOpen,
  onCloseMobile,
  onCreateRoom,
  onLogout,
  onSelectRoom,
  rooms,
  user,
}: RoomSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-[16.5rem] flex-col border-r border-white/8 bg-black/68 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform lg:static lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="grid size-9 place-items-center rounded-lg bg-teal-300 text-zinc-950 shadow-lg shadow-teal-500/20"
            aria-label="Go to dashboard"
          >
            <MessageCircle size={18} aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">WS Chat</p>
            <p className="truncate text-xs text-zinc-500">Workspace</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="grid size-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 lg:hidden"
          aria-label="Close room menu"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </div>

      <Button type="button" onClick={onCreateRoom} className="mt-5 w-full py-2.5">
        <Plus size={17} aria-hidden="true" />
        Create room
      </Button>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Rooms</p>
        <div className="grid gap-2">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isActive={room.id === activeRoomId}
              onSelect={(roomId) => {
                onSelectRoom(roomId)
                onCloseMobile()
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 border-t border-white/8 pt-3">
        <div className="flex items-center gap-3">
          <Avatar name={user?.username ?? 'User'} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.username}</p>
            <p className="truncate text-xs text-zinc-400">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="grid size-9 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Logout"
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}
