import {
  ArrowRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  Code2,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Trophy,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '../components/chat/EmptyState'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Separator } from '../components/ui/separator'
import { Skeleton } from '../components/ui/skeleton'
import { useAuth } from '../hooks/useAuth'
import { useRooms } from '../hooks/useRooms'

type WorkspaceTemplate = {
  title: string
  description: string
  icon: ReactNode
  defaultRoomName: string
}

type StaticRoomPreview = {
  title: string
  roomType: string
  description: string
  badge: 'Free' | 'Paid'
}

type WorkspaceActionCardProps = {
  description: string
  icon: ReactNode
  onClick: () => void
  title: string
}

const workspaceTemplates: WorkspaceTemplate[] = [
  {
    title: 'Collaborate',
    description: 'Create your room to collaborate',
    defaultRoomName: 'Collaboration Room',
    icon: <MessageSquare size={16} aria-hidden="true" />,
  },
  {
    title: 'Compete',
    description: 'Create your room to compete',
    defaultRoomName: 'Contest Room',
    icon: <Trophy size={16} aria-hidden="true" />,
  },
  {
    title: 'Develop',
    description: 'Create your room to develop',
    defaultRoomName: 'Development Room',
    icon: <Code2 size={16} aria-hidden="true" />,
  },
]

const staticRoomPreviews: StaticRoomPreview[] = [
  {
    title: 'JavaScript Basics',
    roomType: 'Development Room',
    description: 'A focused room for learning JavaScript fundamentals with chat, code, and notes.',
    badge: 'Free',
  },
  {
    title: 'Python Challenge',
    roomType: 'Competitive Room',
    description: 'Practice problem solving with teammates before contests and interviews.',
    badge: 'Paid',
  },
  {
    title: 'Design Thinking',
    roomType: 'Collaborative Room',
    description: 'Plan flows, sketch ideas, and discuss architecture in a shared workspace.',
    badge: 'Free',
  },
  {
    title: 'Machine Learning 101',
    roomType: 'Development Room',
    description: 'Study ML concepts, test snippets, and keep learning sessions organized.',
    badge: 'Paid',
  },
  {
    title: 'Agile Workshop',
    roomType: 'Collaborative Room',
    description: 'Run sprint planning, standups, and team discussions from one room.',
    badge: 'Free',
  },
  {
    title: 'Coding Olympics',
    roomType: 'Competitive Room',
    description: 'Host friendly coding rounds with realtime discussion and shared context.',
    badge: 'Paid',
  },
  {
    title: 'React Sprint Room',
    roomType: 'Development Room',
    description: 'Build UI flows, review components, and keep frontend work focused.',
    badge: 'Free',
  },
  {
    title: 'System Design Lab',
    roomType: 'Collaborative Room',
    description: 'Discuss architecture, tradeoffs, scaling plans, and service boundaries.',
    badge: 'Paid',
  },
  {
    title: 'Backend Review Room',
    roomType: 'Development Room',
    description: 'Debug APIs, validate database flows, and review backend decisions together.',
    badge: 'Free',
  },
  {
    title: 'Whiteboard Jam',
    roomType: 'Collaborative Room',
    description: 'Sketch product ideas, diagrams, and planning notes before implementation.',
    badge: 'Free',
  },
  {
    title: 'AI Study Circle',
    roomType: 'Practice Room',
    description: 'Learn model APIs, prompts, and implementation patterns with teammates.',
    badge: 'Paid',
  },
  {
    title: 'Hackathon Squad',
    roomType: 'Collaborative Room',
    description: 'Coordinate ideas, code, execution, and board planning in one place.',
    badge: 'Free',
  },
]

const roomPreviewPageSize = 6

const cardFrameClassName =
  'rounded-2xl bg-gradient-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5'

const actionCardClassName =
  'relative flex h-full min-h-[7.25rem] flex-col justify-between overflow-hidden rounded-[14px] bg-[#18181B]/78 p-3.5 backdrop-blur-2xl transition duration-300 group-hover:bg-[#1F1F23]/88'

const iconBoxClassName =
  'grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-gradient-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#D6FFF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'

function WorkspaceActionCard({ description, icon, onClick, title }: WorkspaceActionCardProps) {
  return (
    <button type="button" onClick={onClick} className={`${cardFrameClassName} group text-left`}>
      <Card className={actionCardClassName}>
        <span className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[#57F1DB]/[0.04] blur-2xl" />
        <CardHeader className="relative gap-2">
          <div className={iconBoxClassName}>{icon}</div>
          <div className="grid gap-2">
            <CardTitle className="text-base text-[#F7F7F8]">{title}</CardTitle>
            <CardDescription className="max-w-md text-sm leading-5 text-[#BACAC5]">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="relative mt-2">
          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-1 text-sm font-semibold text-[#D6FFF6] transition duration-200 group-hover:border-[#57F1DB]/40 group-hover:bg-[#57F1DB]/10">
            Create room
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </CardFooter>
      </Card>
    </button>
  )
}

function StaticRoomCard({ room }: { room: StaticRoomPreview }) {
  return (
    <Card className="flex min-h-[13rem] flex-col justify-between rounded-2xl border border-white/10 bg-[#060A12]/76 p-5 shadow-[0_18px_52px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-0.5 hover:border-[#57F1DB]/25 hover:bg-[#090E17]/86">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#F7F7F8]">{room.title}</h3>
            <p className="mt-2 text-sm font-medium text-[#D6FFF6]">{room.roomType}</p>
          </div>
          <Badge
            className={[
              'shrink-0 border-white/8 px-3 py-1 text-xs font-bold',
              room.badge === 'Paid'
                ? 'bg-[#6D28D9]/85 text-white'
                : 'bg-[#1F2937]/85 text-white',
            ].join(' ')}
          >
            {room.badge}
          </Badge>
        </div>
        <p className="mt-5 max-w-md text-sm leading-6 text-[#E5E7EB]">{room.description}</p>
      </div>
      <button
        type="button"
        className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-black/20 text-sm font-semibold text-[#F7F7F8] transition hover:border-[#57F1DB]/35 hover:bg-white/[0.04]"
      >
        Join Room
      </button>
    </Card>
  )
}

function RealRoomCard({
  membersCount,
  onClick,
  roomCode,
  roomName,
}: {
  membersCount: number
  onClick: () => void
  roomCode?: string
  roomName: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl bg-gradient-to-b from-[#5A5A5C]/70 via-white/12 to-[#28282A]/75 p-[2px] text-left shadow-[0_16px_48px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-0.5"
    >
      <Card className="flex h-full min-h-[9rem] flex-col justify-between rounded-[14px] bg-[#111316]/86 p-5 transition duration-300 group-hover:bg-[#181B1E]/92">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-[#F7F7F8]">{roomName}</h3>
            <p className="mt-1 text-sm text-[#A7B8B3]">{membersCount} members</p>
          </div>
          {roomCode ? (
            <Badge className="shrink-0 border-white/8 bg-white/[0.04] font-mono text-[10px] text-[#BACAC5]">
              {roomCode}
            </Badge>
          ) : null}
        </div>
        <span className="mt-5 inline-flex items-center justify-between rounded-xl border border-white/8 bg-black/18 px-3 py-2 text-xs font-semibold text-[#D6FFF6] transition group-hover:border-[#57F1DB]/35">
          Open room
          <ArrowRight size={13} aria-hidden="true" />
        </span>
      </Card>
    </button>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { createRoom, isLoadingRooms, roomError, rooms } = useRooms()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [useMemberLimit, setUseMemberLimit] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [staticRoomSearchQuery, setStaticRoomSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'home' | 'rooms'>('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)
  const [defaultRoomName, setDefaultRoomName] = useState('')
  const [roomPreviewPage, setRoomPreviewPage] = useState(1)

  const closeModal = () => {
    setIsCreateModalOpen(false)
    setUseMemberLimit(false)
    setFormError(null)
    setDefaultRoomName('')
  }

  const openCreateModal = (roomName = '') => {
    setFormError(null)
    setDefaultRoomName(roomName)
    setIsCreateModalOpen(true)
  }

  const handleRoomSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const formData = new FormData(event.currentTarget)

    try {
      const roomName = String(formData.get('roomName') ?? '')
      const maxMembersValue = Number(formData.get('maxMembers') ?? 0)
      const room = await createRoom({
        name: roomName,
        unlimitedMembers: !useMemberLimit,
        maxMembers: useMemberLimit ? maxMembersValue : null,
      })

      closeModal()
      navigate(`/rooms/${room.id}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    }
  }

  const createdRoomsCount = rooms.filter((room) => room.adminId === user?.id).length
  const joinedRoomsCount = rooms.filter((room) => room.adminId !== user?.id).length

  const filteredRooms = rooms.filter((room) => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return true
    }

    const roomName = room.name.toLowerCase()
    const roomCode = (room.joinCode ?? '').toLowerCase()

    return roomName.includes(query) || roomCode.includes(query)
  })

  const staticRoomSearchText = staticRoomSearchQuery.trim().toLowerCase()
  const filteredStaticRoomPreviews = staticRoomPreviews.filter((room) => {
    if (!staticRoomSearchText) {
      return true
    }

    const roomTitle = room.title.toLowerCase()
    const roomType = room.roomType.toLowerCase()
    const roomDescription = room.description.toLowerCase()

    return (
      roomTitle.includes(staticRoomSearchText) ||
      roomType.includes(staticRoomSearchText) ||
      roomDescription.includes(staticRoomSearchText)
    )
  })
  const totalRoomPreviewPages = Math.max(1, Math.ceil(filteredStaticRoomPreviews.length / roomPreviewPageSize))
  const roomPreviewStartIndex = (roomPreviewPage - 1) * roomPreviewPageSize
  const visibleStaticRoomPreviews = filteredStaticRoomPreviews.slice(
    roomPreviewStartIndex,
    roomPreviewStartIndex + roomPreviewPageSize,
  )

  const goToPreviousRoomPreviewPage = () => {
    setRoomPreviewPage((currentPage) => Math.max(currentPage - 1, 1))
  }

  const goToNextRoomPreviewPage = () => {
    setRoomPreviewPage((currentPage) => Math.min(currentPage + 1, totalRoomPreviewPages))
  }

  const changeDashboardTab = (tabName: 'home' | 'rooms') => {
    setActiveTab(tabName)
    setIsSidebarOpen(false)
  }

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed((currentValue) => !currentValue)
  }

  const renderSidebarContent = (isCollapsed: boolean, isMobileSidebar: boolean) => {
    const sidebarNavItems = [
      {
        icon: <Home size={17} aria-hidden="true" />,
        id: 'home' as const,
        label: 'Workspace',
      },
      {
        icon: <LayoutGrid size={17} aria-hidden="true" />,
        id: 'rooms' as const,
        label: 'Rooms',
      },
    ]

    return (
      <>
        <div
          className={[
            'flex items-center border-b border-white/8 pb-6',
            isCollapsed ? 'justify-center' : 'justify-between',
          ].join(' ')}
        >
          <div className={['flex min-w-0 items-center', isCollapsed ? 'justify-center' : 'gap-3'].join(' ')}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] shadow-lg shadow-black/30">
              <img src="/starsync-logo.png" alt="StarSync logo" className="h-9 w-9 rounded-full object-cover" />
            </span>
            {!isCollapsed ? (
              <p className="truncate text-sm font-bold uppercase tracking-wider text-[#F7F7F8]">StarSync</p>
            ) : null}
          </div>

          {isMobileSidebar ? (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="grid size-8 place-items-center rounded-lg text-[#8D9B97] transition hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 py-6">
          {sidebarNavItems.map((item) => {
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => changeDashboardTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={[
                  'flex w-full items-center rounded-xl border text-sm font-medium transition duration-150',
                  isCollapsed ? 'mx-auto h-11 w-11 justify-center px-0 py-0' : 'gap-3 px-4 py-3',
                  isActive
                    ? 'border-r-2 border-[#57F1DB] border-y-white/8 border-l-white/8 bg-white/[0.055] text-[#D6FFF6]'
                    : 'border-transparent text-[#95A5A0] hover:border-white/8 hover:bg-white/[0.035] hover:text-white',
                ].join(' ')}
              >
                {item.icon}
                {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/8 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={logout}
            className={[
              'py-2.5 text-xs',
              isCollapsed ? 'mx-auto h-11 w-11 justify-center px-0' : 'w-full justify-center',
            ].join(' ')}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={14} aria-hidden="true" />
            {!isCollapsed ? 'Logout' : null}
          </Button>
        </div>

        {!isMobileSidebar ? (
          <button
            type="button"
            onClick={toggleDesktopSidebar}
            className="absolute right-0 top-1/2 z-[80] grid size-9 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/12 bg-[#141820] text-[#D6FFF6] shadow-xl shadow-black/45 transition hover:border-[#57F1DB]/45 hover:bg-[#1C232A]"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
          </button>
        ) : null}
      </>
    )
  }

  const renderMainContent = (showMobileMenuButton: boolean) => {
    return (
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-20 w-full shrink-0 items-center justify-between border-b border-white/10 bg-[#030404]/95 px-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            {showMobileMenuButton ? (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-[#95A5A0] transition hover:text-white lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={18} aria-hidden="true" />
              </button>
            ) : null}
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[#F7F7F8]">
                {activeTab === 'home' ? 'Workspace' : 'Rooms'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-[#BACAC5] transition hover:border-[#57F1DB]/35 hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={17} aria-hidden="true" />
            </button>
            <Avatar name={user?.username ?? 'User'} seed={user?.username ?? user?.email ?? 'user'} size="sm" />
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="dashboard-workspace-field" />

          <div className="relative z-10 mx-auto w-full max-w-[1480px] space-y-8 px-5 pb-14 pt-7 sm:px-8 lg:px-10 xl:px-12">
            {activeTab === 'home' ? (
              <div className="space-y-8">
                <section className="mx-auto max-w-3xl text-center">
                  <h2 className="text-3xl font-semibold tracking-tight text-[#F7F7F8] sm:text-4xl">
                    StarSync Dashboard
                  </h2>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {workspaceTemplates.map((template) => (
                    <WorkspaceActionCard
                      key={template.title}
                      title={template.title}
                      description={template.description}
                      icon={template.icon}
                      onClick={() => openCreateModal(template.defaultRoomName)}
                    />
                  ))}
                </section>

                <section className="mt-8 space-y-5">
                  <div className="grid gap-5 text-center">
                    <div className="relative mx-auto w-full max-w-md">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#70817D]"
                        aria-hidden="true"
                      />
                      <Input
                        type="text"
                        value={staticRoomSearchQuery}
                        onChange={(event) => {
                          setStaticRoomSearchQuery(event.target.value)
                          setRoomPreviewPage(1)
                        }}
                        placeholder="Search room examples..."
                        className="h-12 w-full rounded-xl bg-black/22 pl-11 text-base placeholder:text-[#5F6B68] focus:border-[#57F1DB]/35"
                      />
                    </div>
                  </div>

                  {visibleStaticRoomPreviews.length ? (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {visibleStaticRoomPreviews.map((room) => (
                        <StaticRoomCard key={room.title} room={room} />
                      ))}
                    </div>
                  ) : (
                    <Card className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#060A12]/76 p-6 text-center text-sm text-[#BACAC5]">
                      No room examples match that search.
                    </Card>
                  )}

                  {filteredStaticRoomPreviews.length > roomPreviewPageSize ? (
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                      type="button"
                      onClick={goToPreviousRoomPreviewPage}
                      disabled={roomPreviewPage === 1}
                      className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#8D9B97] transition hover:text-[#F7F7F8] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <ChevronLeft size={15} aria-hidden="true" />
                      Previous
                    </button>

                    {Array.from({ length: totalRoomPreviewPages }, (_, index) => {
                      const pageNumber = index + 1
                      const isCurrentPage = pageNumber === roomPreviewPage

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setRoomPreviewPage(pageNumber)}
                          className={[
                            'grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold transition',
                            isCurrentPage
                              ? 'border-[#57F1DB]/35 bg-white/[0.055] text-[#D6FFF6]'
                              : 'border-transparent text-[#F7F7F8] hover:border-white/10 hover:bg-white/[0.035]',
                          ].join(' ')}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}

                    <button
                      type="button"
                      onClick={goToNextRoomPreviewPage}
                      disabled={roomPreviewPage === totalRoomPreviewPages}
                      className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#F7F7F8] transition hover:text-[#D6FFF6] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Next
                      <ChevronRight size={15} aria-hidden="true" />
                    </button>
                    </div>
                  ) : null}
                </section>
              </div>
            ) : (
              <div className="space-y-8">
                <section className="mx-auto max-w-3xl text-center">
                  <h2 className="text-3xl font-semibold tracking-tight text-[#F7F7F8] sm:text-4xl">Rooms</h2>
                  <p className="mt-3 text-sm leading-6 text-[#BACAC5] sm:text-base">
                    Search, manage, and open your joined workspaces.
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <Badge className="gap-2 font-mono text-xs">
                      <span className="text-[#859490]">Created</span>
                      <span className="font-bold text-[#D6FFF6]">{createdRoomsCount}</span>
                    </Badge>
                    <Badge className="gap-2 font-mono text-xs">
                      <span className="text-[#859490]">Joined</span>
                      <span className="font-bold text-[#D6FFF6]">{joinedRoomsCount}</span>
                    </Badge>
                  </div>
                </section>

                <div className="mx-auto max-w-xl">
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#70817D]"
                      aria-hidden="true"
                    />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search your rooms..."
                      className="h-12 rounded-xl bg-black/22 pl-11 text-base placeholder:text-[#5F6B68] focus:border-[#57F1DB]/35"
                    />
                  </div>
                </div>

                <Separator />

                <section className="space-y-4">
                  {isLoadingRooms ? (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {[0, 1, 2, 3, 4, 5].map((item) => (
                        <Skeleton key={item} className="h-36 rounded-2xl border border-white/5 bg-white/[0.05]" />
                      ))}
                    </div>
                  ) : roomError ? (
                    <Card className="border border-red-300/20 bg-red-950/20 p-4 text-sm text-red-200">
                      {roomError}
                    </Card>
                  ) : filteredRooms.length ? (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {filteredRooms.map((room) => (
                        <RealRoomCard
                          key={room.id}
                          roomName={room.name}
                          roomCode={room.joinCode}
                          membersCount={room._count?.members ?? 0}
                          onClick={() => navigate(`/rooms/${room.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      variant="dashboard"
                      title="No rooms found"
                      description={
                        searchQuery
                          ? 'No matching rooms found.'
                          : 'Create a room from Workspace, then it will appear here.'
                      }
                    />
                  )}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <section className="relative flex h-dvh overflow-hidden bg-black text-[#E5E1E4]">
      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default border-none bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar backdrop"
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/8 bg-[#07090A]/92 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl transition-transform duration-300 lg:hidden',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {renderSidebarContent(false, true)}
      </aside>

      <div className="relative z-10 hidden min-w-0 flex-1 lg:flex">
        <aside
          className={[
            'relative z-40 flex h-full shrink-0 flex-col overflow-visible border-r border-white/8 bg-[#07090A]/92 shadow-2xl shadow-black/35 backdrop-blur-2xl transition-[width,padding] duration-300',
            isDesktopSidebarCollapsed ? 'w-[5rem] px-2 py-5' : 'w-48 p-4',
          ].join(' ')}
        >
          {renderSidebarContent(isDesktopSidebarCollapsed, false)}
        </aside>

        {renderMainContent(false)}
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:hidden">{renderMainContent(true)}</div>

      <Modal isOpen={isCreateModalOpen} onClose={closeModal} title="Create room">
        <form onSubmit={handleRoomSubmit} className="grid gap-4">
          <label className="grid gap-2 text-sm text-zinc-300">
            Room name
            <Input name="roomName" placeholder="DSA Study Group" defaultValue={defaultRoomName} autoFocus />
          </label>

          <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <p className="text-sm font-medium text-white">Member limit</p>
            <label className="flex items-start gap-3 text-sm text-zinc-300">
              <input
                type="radio"
                name="memberLimitMode"
                checked={!useMemberLimit}
                onChange={() => setUseMemberLimit(false)}
                className="mt-1"
              />
              <span>
                Unlimited
                <span className="block text-xs text-zinc-500">Anyone with the room code can join.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-zinc-300">
              <input
                type="radio"
                name="memberLimitMode"
                checked={useMemberLimit}
                onChange={() => setUseMemberLimit(true)}
                className="mt-1"
              />
              <span className="grid flex-1 gap-2">
                Limit members
                <Input name="maxMembers" type="number" min="2" defaultValue="10" disabled={!useMemberLimit} />
                <span className="text-xs text-zinc-500">Includes you as admin.</span>
              </span>
            </label>
          </div>

          {formError ? (
            <p className="rounded-lg border border-red-300/20 bg-red-950/20 p-3 text-sm text-red-200">
              {formError}
            </p>
          ) : null}

          <Button type="submit">Create room</Button>
        </form>
      </Modal>
    </section>
  )
}

