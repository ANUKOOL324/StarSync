import { ChevronDown, ChevronRight, Code, LogOut, MessageCircle, MessageSquare, Palette, Plus, Search, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { roomMemberService } from '../../services/roomMemberService'
import type { AuthUser } from '../../types/auth'
import type { ChatRoom, OnlineUser, RoomMember } from '../../types/chat'
import { Avatar } from '../ui/Avatar'
import { RoomCard } from './RoomCard'

type RoomSidebarProps = {
  activeRoom: ChatRoom
  activeRoomId: string
  activeTab: WorkspaceTab
  dmRooms: ChatRoom[]
  isOpen: boolean
  onClose: () => void
  onlineUsers: OnlineUser[]
  onCreateDm: (userId: string, sourceRoomId?: string) => Promise<ChatRoom>
  onCreateRoom: () => void
  onLogout: () => void
  onSelectRoom: (roomId: string) => void
  onTabChange: (tab: WorkspaceTab) => void
  panelWidth: number
  rooms: ChatRoom[]
  user: AuthUser | null
}

type WorkspaceTab = 'chat' | 'editor' | 'whiteboard'

type SectionHeaderProps = {
  actionLabel?: string
  isOpen: boolean
  onAction?: () => void
  onToggle: () => void
  title: string
}

function SectionHeader({ actionLabel, isOpen, onAction, onToggle, title }: SectionHeaderProps) {
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 py-1 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500 transition hover:bg-white/[0.045] hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35"
      >
        <ChevronIcon size={14} aria-hidden="true" className="shrink-0 transition group-hover:text-[#18D6A3]" />
        <span className="truncate">{title}</span>
      </button>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="grid size-7 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.055] hover:text-[#18D6A3] focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35"
          aria-label={actionLabel}
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

const workKeywords = ['work', 'project', 'team', 'internship', 'open-source', 'opensource']
const studyKeywords = ['study', 'dsa', 'web-dev', 'webdev', 'coding', 'exam', 'class']

const workspaceTabs: Array<{
  id: WorkspaceTab
  label: string
  icon: typeof MessageSquare
}> = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'editor', label: 'Editor', icon: Code },
  { id: 'whiteboard', label: 'Board', icon: Palette },
]

const roomMatchesKeywords = (room: ChatRoom, keywords: string[]) => {
  const searchableText = `${room.name} ${room.slug}`.toLowerCase()
  return keywords.some((keyword) => searchableText.includes(keyword))
}

export function RoomSidebar({
  activeRoom,
  activeRoomId,
  activeTab,
  dmRooms,
  isOpen,
  onClose,
  onlineUsers,
  onCreateDm,
  onCreateRoom,
  onLogout,
  onSelectRoom,
  onTabChange,
  panelWidth,
  rooms,
  user,
}: RoomSidebarProps) {
  const navigate = useNavigate()
  const [roomSearchQuery, setRoomSearchQuery] = useState('')
  const [isStudyRoomsOpen, setIsStudyRoomsOpen] = useState(true)
  const [isWorkRoomsOpen, setIsWorkRoomsOpen] = useState(true)
  const [isDirectMessagesOpen, setIsDirectMessagesOpen] = useState(true)
  const [dmSearchError, setDmSearchError] = useState<string | null>(null)
  const [isLoadingRoomMembers, setIsLoadingRoomMembers] = useState(false)
  const [openingDmUserId, setOpeningDmUserId] = useState<string | null>(null)
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([])

  const normalizedSearchQuery = roomSearchQuery.trim().toLowerCase()

  const filteredGroupRooms = useMemo(() => {
    if (!normalizedSearchQuery) {
      return rooms
    }

    return rooms.filter((room) => {
      const roomName = room.name.toLowerCase()
      const roomSlug = room.slug.toLowerCase()

      return roomName.includes(normalizedSearchQuery) || roomSlug.includes(normalizedSearchQuery)
    })
  }, [normalizedSearchQuery, rooms])

  const workRooms = filteredGroupRooms.filter((room) => roomMatchesKeywords(room, workKeywords))
  const studyRooms = filteredGroupRooms.filter((room) => {
    const isWorkRoom = roomMatchesKeywords(room, workKeywords)
    const isStudyRoom = roomMatchesKeywords(room, studyKeywords)

    return isStudyRoom || !isWorkRoom
  })

  const isDirectMessageRoom = activeRoom.type === 'DM'
  const dmRoomByOtherUserId = useMemo(() => {
    const roomByUserId = new Map<string, ChatRoom>()

    dmRooms.forEach((room) => {
      if (room.otherUser?.id) {
        roomByUserId.set(room.otherUser.id, room)
      }
    })

    return roomByUserId
  }, [dmRooms])
  const onlineUserIds = useMemo(() => new Set(onlineUsers.map((onlineUser) => onlineUser.id)), [onlineUsers])
  const filteredRoomMembers = useMemo(() => {
    return roomMembers
      .filter((member) => member.id !== user?.id)
      .filter((member) => {
        if (!normalizedSearchQuery) {
          return true
        }

        const memberUsername = member.username.toLowerCase()
        const memberEmail = member.email.toLowerCase()

        return memberUsername.includes(normalizedSearchQuery) || memberEmail.includes(normalizedSearchQuery)
      })
      .map((member) => ({
        ...member,
        isOnline: onlineUserIds.has(member.id),
      }))
  }, [normalizedSearchQuery, onlineUserIds, roomMembers, user?.id])

  useEffect(() => {
    let isCurrentRequest = true

    setDmSearchError(null)
    setRoomMembers([])

    if (!isDirectMessagesOpen || isDirectMessageRoom) {
      return
    }

    const loadRoomMembers = async () => {
      try {
        setIsLoadingRoomMembers(true)
        const members = await roomMemberService.list(activeRoom.id)

        if (isCurrentRequest) {
          setRoomMembers(members)
        }
      } catch {
        if (isCurrentRequest) {
          setDmSearchError('Room members could not be loaded.')
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoadingRoomMembers(false)
        }
      }
    }

    void loadRoomMembers()

    return () => {
      isCurrentRequest = false
    }
  }, [activeRoom.id, isDirectMessageRoom, isDirectMessagesOpen])

  const handleCreateDm = async (targetUserId: string) => {
    const sourceRoomId = isDirectMessageRoom ? undefined : activeRoom.id

    try {
      setOpeningDmUserId(targetUserId)
      const room = await onCreateDm(targetUserId, sourceRoomId)

      setRoomMembers([])
      navigate(`/rooms/${room.id}`)
      if (window.innerWidth < 1280) {
        onClose()
      }
    } finally {
      setOpeningDmUserId(null)
    }
  }

  return (
    <aside
      data-open={isOpen}
      className={[
        'chat-mobile-sidebar neon-sidebar-field flex h-dvh w-[min(85vw,18rem)] flex-col bg-[#09090B]/95 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl transition-transform duration-200 xl:h-full xl:max-w-none xl:shrink-0 xl:transition-[width] xl:duration-200',
        isOpen
          ? 'border-r border-white/10'
          : 'pointer-events-none xl:pointer-events-auto',
        isOpen
          ? 'xl:w-[var(--sidebar-panel-width)] xl:overflow-visible'
          : 'xl:w-0 xl:overflow-hidden xl:border-r-0 xl:p-0',
      ].join(' ')}
      style={{ '--sidebar-panel-width': `${panelWidth}px` } as CSSProperties}
      aria-hidden={!isOpen}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 pb-1">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#7FFFE0] shadow-lg shadow-black/20 transition hover:border-[#18D6A3]/30 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40"
              aria-label="Go to dashboard"
            >
              <MessageCircle size={18} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">WS Chat</p>
              <p className="truncate text-xs text-slate-500">Collaboration workspace</p>
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

        <button
          type="button"
          onClick={onCreateRoom}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-[#18D6A3] px-4 text-sm font-semibold text-[#03110E] shadow-[0_16px_40px_rgba(24,214,163,0.20)] transition duration-150 hover:-translate-y-0.5 hover:bg-[#35E0B4] hover:shadow-[0_18px_44px_rgba(245,158,11,0.12)] focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/45 active:translate-y-0 active:scale-[0.99]"
        >
          <Plus size={17} aria-hidden="true" />
          Create room
        </button>

        <label className="group mt-3 flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-slate-500 shadow-sm shadow-black/20 backdrop-blur-xl transition focus-within:border-[#18D6A3]/30 focus-within:bg-white/[0.065] focus-within:text-[#18D6A3] focus-within:ring-2 focus-within:ring-[#18D6A3]/10">
          <Search size={15} aria-hidden="true" className="transition group-focus-within:text-[#18D6A3]" />
          <input
            aria-label="Search rooms and direct messages"
            value={roomSearchQuery}
            onChange={(event) => setRoomSearchQuery(event.target.value)}
            placeholder="Search rooms"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
        </label>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-1 shadow-sm shadow-black/20 backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-1">
            {workspaceTabs.map((tab) => {
              const TabIcon = tab.icon
              const isActiveTab = activeTab === tab.id

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
                    'flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35',
                    isActiveTab
                      ? 'bg-[#18D6A3]/14 text-[#7FFFE0] shadow-sm shadow-[#18D6A3]/10'
                      : 'text-slate-500 hover:bg-white/[0.055] hover:text-slate-200',
                  ].join(' ')}
                  aria-pressed={isActiveTab}
                >
                  <TabIcon size={14} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <section>
            <SectionHeader
              isOpen={isStudyRoomsOpen}
              onToggle={() => setIsStudyRoomsOpen((current) => !current)}
              title="Study rooms"
            />
            {isStudyRoomsOpen ? (
              <div className="mt-1.5 grid gap-1.5">
                {studyRooms.map((room) => (
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
                {!studyRooms.length ? (
                  <p className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3 text-sm text-slate-500 backdrop-blur-xl">
                    No study rooms found.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="mt-4">
            <SectionHeader
              isOpen={isWorkRoomsOpen}
              onToggle={() => setIsWorkRoomsOpen((current) => !current)}
              title="Work rooms"
            />
            {isWorkRoomsOpen ? (
              <div className="mt-1.5 grid gap-1.5">
                {workRooms.map((room) => (
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
                {!workRooms.length ? (
                  <p className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3 text-sm text-slate-500 backdrop-blur-xl">
                    No work rooms found.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="mt-4">
            <SectionHeader
              isOpen={isDirectMessagesOpen}
              onToggle={() => setIsDirectMessagesOpen((current) => !current)}
              title="Direct messages"
            />
            {isDirectMessagesOpen ? (
              <div className="mt-1.5 grid gap-1.5">
                {isDirectMessageRoom ? (
                  <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm leading-5 text-slate-500 backdrop-blur-xl">
                    Open a study or work room to see people you can message.
                  </p>
                ) : null}

                {!isDirectMessageRoom && isLoadingRoomMembers ? (
                  <div className="grid gap-1.5">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="flex min-h-12 items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.025] px-2.5 py-2"
                      >
                        <span className="size-9 rounded-full bg-white/10" />
                        <span className="grid flex-1 gap-1.5">
                          <span className="h-3 w-24 rounded-full bg-white/10" />
                          <span className="h-2.5 w-16 rounded-full bg-white/[0.07]" />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {!isDirectMessageRoom && dmSearchError ? (
                  <p className="rounded-xl border border-red-300/20 bg-red-950/20 px-3 py-3 text-sm text-red-200">
                    {dmSearchError}
                  </p>
                ) : null}

                {!isDirectMessageRoom && !isLoadingRoomMembers && !dmSearchError
                  ? filteredRoomMembers.map((member) => {
                      const existingDmRoom = dmRoomByOtherUserId.get(member.id)
                      const isActiveDm = existingDmRoom?.id === activeRoomId
                      const rowClassName = [
                        'group relative flex min-h-12 w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left backdrop-blur-xl transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35',
                        isActiveDm
                          ? 'border-[#18D6A3]/28 bg-[#18D6A3]/9 shadow-[0_10px_28px_rgba(24,214,163,0.10)]'
                          : 'border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.045]',
                      ].join(' ')
                      const isOpeningThisDm = openingDmUserId === member.id
                      const rowContent = (
                        <>
                           <span className="relative shrink-0">
                            <Avatar name={member.username} seed={member.email} size="sm" />
                            <span
                              className={[
                                'absolute bottom-0 right-0 size-2.5 rounded-full border border-[#05080A]',
                                member.isOnline ? 'bg-[#22C55E]' : 'bg-slate-600',
                              ].join(' ')}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold leading-5 text-slate-100">
                              {member.username}
                            </span>
                            <span className="block truncate text-xs leading-4 text-slate-500">
                              {isOpeningThisDm
                                ? 'Opening...'
                                : member.isOnline
                                  ? 'Online'
                                  : existingDmRoom
                                    ? 'Direct message'
                                    : 'In this room'}
                            </span>
                          </span>
                          {existingDmRoom?.unreadCount ? (
                            <span className="min-w-5 rounded-full border border-white/10 bg-[#18D6A3] px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-[#03110E]">
                              {existingDmRoom.unreadCount}
                            </span>
                          ) : null}
                        </>
                      )

                      return (
                        <button
                          key={member.id}
                          type="button"
                          disabled={Boolean(openingDmUserId)}
                          onClick={() => void handleCreateDm(member.id)}
                          className={rowClassName}
                        >
                          {rowContent}
                        </button>
                      )
                    })
                  : null}

                {!isDirectMessageRoom && !isLoadingRoomMembers && !dmSearchError && !filteredRoomMembers.length ? (
                  <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm leading-5 text-slate-500 backdrop-blur-xl">
                    {normalizedSearchQuery
                      ? 'No matching members in this room.'
                      : 'No other members in this room.'}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-2.5 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-[#18D6A3]/25 hover:bg-white/[0.06]">
            <Avatar name={user?.username ?? 'User'} seed={user?.username ?? user?.email ?? 'user'} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">{user?.username}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
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
