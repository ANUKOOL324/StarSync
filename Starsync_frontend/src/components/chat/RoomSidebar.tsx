import { ChevronDown, ChevronRight, Code, LogOut, MessageSquare, Palette, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { AuthUser } from '../../types/auth'
import type { ChatRoom, OnlineUser } from '../../types/chat'
import { Avatar } from '../ui/Avatar'
import { DirectMessagesSection } from './DirectMessagesSection'
import { RoomCard } from './RoomCard'

type RoomSidebarProps = {
  activeRoom: ChatRoom
  activeRoomId: string
  activeTab: WorkspaceTab
  dmRooms: ChatRoom[]
  isOpen: boolean
  onClose: () => void
  onlineUsers: OnlineUser[]
  onLogout: () => void
  onSelectRoom: (roomId: string) => void
  onTabChange: (tab: WorkspaceTab) => void
  rooms: ChatRoom[]
  user: AuthUser | null
}

type WorkspaceTab = 'chat' | 'editor' | 'whiteboard'

type SectionHeaderProps = {
  isOpen: boolean
  onToggle: () => void
  title: string
}

function SectionHeader({ isOpen, onToggle, title }: SectionHeaderProps) {
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="group flex w-full min-w-0 items-center gap-1.5 rounded-lg px-1 py-1 text-left transition hover:bg-white/[0.055] hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35"
    >
      <ChevronIcon size={14} aria-hidden="true" className="shrink-0 transition group-hover:text-[#18D6A3]" />
      <span className="room-font-kicker truncate text-xs text-slate-400">{title}</span>
    </button>
  )
}

const workspaceTabs: Array<{
  id: WorkspaceTab
  label: string
  icon: typeof MessageSquare
}> = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'editor', label: 'Editor', icon: Code },
  { id: 'whiteboard', label: 'Board', icon: Palette },
]

const activeTabClasses: Record<WorkspaceTab, { active: string; focus: string }> = {
  chat: {
    active: "bg-emerald-500/14 text-[#86EFAC] shadow-sm shadow-emerald-500/10",
    focus: "focus:ring-emerald-500/35",
  },
  editor: {
    active: "bg-blue-500/14 text-[#93C5FD] shadow-sm shadow-blue-500/10",
    focus: "focus:ring-blue-500/35",
  },
  whiteboard: {
    active: "bg-amber-500/14 text-[#FDE68A] shadow-sm shadow-amber-500/10",
    focus: "focus:ring-amber-500/35",
  },
}


export function RoomSidebar({
  activeRoom,
  activeRoomId,
  activeTab,
  dmRooms,
  isOpen,
  onClose,
  onlineUsers,
  onLogout,
  onSelectRoom,
  onTabChange,
  rooms,
  user,
}: RoomSidebarProps) {
  const navigate = useNavigate()
  const [roomSearchQuery, setRoomSearchQuery] = useState('')
  const [isRoomsOpen, setIsRoomsOpen] = useState(true)
  const [isDirectMessagesOpen, setIsDirectMessagesOpen] = useState(true)

  const normalizedSearchQuery = roomSearchQuery.trim().toLowerCase()
  const isDirectMessageRoom = activeRoom.type === 'DM'
  const visibleTabs = isDirectMessageRoom ? workspaceTabs.filter((tab) => tab.id === 'chat') : workspaceTabs

  const filteredGroupRooms = useMemo(() => {
    if (!normalizedSearchQuery) {
      return rooms
    }

    return rooms.filter((room) => {
      const roomName = room.name.toLowerCase()
      const roomCode = (room.joinCode ?? room.slug).toLowerCase()

      return roomName.includes(normalizedSearchQuery) || roomCode.includes(normalizedSearchQuery)
    })
  }, [normalizedSearchQuery, rooms])

  const filteredDmRooms = useMemo(() => {
    if (!normalizedSearchQuery) return dmRooms
    return dmRooms.filter((room) => {
      const name = (room.otherUser?.username ?? room.name ?? '').toLowerCase()
      return name.includes(normalizedSearchQuery)
    })
  }, [dmRooms, normalizedSearchQuery])

  const onlineUserIds = useMemo(() => new Set(onlineUsers.map((onlineUser) => onlineUser.id)), [onlineUsers])

  return (
    <aside
      data-open={isOpen ? 'true' : 'false'}
      className={[
        'chat-mobile-sidebar neon-sidebar-field flex h-dvh w-[min(92vw,20rem)] flex-col bg-[#09090B] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-200 xl:h-full xl:w-full xl:max-w-none xl:shrink-0 xl:transition-[width] xl:duration-200',
        isOpen
          ? 'border-r border-white/10'
          : 'pointer-events-none xl:pointer-events-auto',
        isOpen
          ? 'xl:overflow-visible'
          : 'xl:w-0 xl:overflow-hidden xl:border-r-0 xl:p-0',
      ].join(' ')}
      aria-hidden={!isOpen}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 pb-1">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] p-1.5 shadow-lg shadow-black/20 transition hover:border-[#18D6A3]/30 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40"
              aria-label="Go to dashboard"
            >
              <img
                src="/starsync-logo.png"
                alt="StarSync logo"
                className="h-full w-full rounded-full object-cover"
              />
            </button>
            <div className="min-w-0">
              <p className="room-font-brand truncate bg-linear-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-sm text-transparent">StarSync</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40 xl:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>



        <div className="mt-3 rounded-2xl bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-px shadow-sm shadow-black/20 transition duration-200 focus-within:from-[#18D6A3]/60 focus-within:to-[#18D6A3]/20">
          <label className="group flex h-[38px] items-center gap-2 rounded-[15px] bg-[#18181B]/78 px-3 text-slate-500 backdrop-blur-xl transition duration-200 focus-within:bg-[#1c1c21] focus-within:text-[#18D6A3]">
            <Search size={15} aria-hidden="true" className="transition group-focus-within:text-[#18D6A3]" />
            <input
              aria-label="Search rooms and direct messages"
              value={roomSearchQuery}
              onChange={(event) => setRoomSearchQuery(event.target.value)}
              placeholder="Search rooms"
              className="room-font-body min-w-0 flex-1 bg-transparent text-sm text-[#F7F7F8] outline-none placeholder:text-slate-500"
            />
          </label>
        </div>

        <div className="mt-3 rounded-2xl border border-white/12 bg-white/[0.05] p-1 shadow-sm shadow-black/20">
          <div className={isDirectMessageRoom ? 'grid grid-cols-1 gap-1' : 'grid grid-cols-3 gap-1'}>
            {visibleTabs.map((tab) => {
              const TabIcon = tab.icon
              const isActiveTab = activeTab === tab.id
              const tabStyles = activeTabClasses[tab.id]

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onTabChange(tab.id)

                    if (window.innerWidth < 1280) {
                      onClose()
                    }
                  }}
                  className={[
                    'room-font-display flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition duration-150 focus:outline-none focus:ring-2',
                    isActiveTab
                      ? `${tabStyles.active} ${tabStyles.focus}`
                      : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-slate-100 focus:ring-[#18D6A3]/35',
                  ].join(' ')}
                  aria-pressed={isActiveTab}
                >
                  <TabIcon size={14} aria-hidden="true" />
                  <span className={isDirectMessageRoom ? 'inline' : 'hidden min-[380px]:inline'}>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          
          <section>
            <SectionHeader
              isOpen={isRoomsOpen}
              onToggle={() => setIsRoomsOpen((current) => !current)}
              title="Rooms"
            />
            {isRoomsOpen ? (
              <div className="mt-1.5 grid gap-1.5">
                {filteredGroupRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isActive={room.id === activeRoomId}
                    onSelect={(roomId) => {
                      onSelectRoom(roomId)
                      if (window.innerWidth < 1280) {
                        onClose()
                      }
                    }}
                  />
                ))}
                {!filteredGroupRooms.length ? (
                  <p className="room-font-body rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-slate-400 backdrop-blur-xl">
                    {normalizedSearchQuery ? 'No matching rooms.' : 'No rooms yet.'}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          
          <DirectMessagesSection
            activeRoomId={activeRoomId}
            dmRooms={filteredDmRooms}
            isOpen={isDirectMessagesOpen}
            normalizedSearchQuery={normalizedSearchQuery}
            onCloseSidebar={onClose}
            onSelectRoom={onSelectRoom}
            onToggle={() => setIsDirectMessagesOpen((current) => !current)}
            onlineUserIds={onlineUserIds}
          />
        </div>

        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-2.5 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-[#18D6A3]/25 hover:bg-white/[0.06]">
            <Avatar name={user?.username ?? 'User'} seed={user?.username ?? user?.email ?? 'user'} size="md" />
            <div className="min-w-0 flex-1">
              <p className="room-font-display truncate text-sm font-semibold text-slate-100">{user?.username}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="grid size-8 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40"
              aria-label="Logout"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
