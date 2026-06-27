import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hash,
  Home,
  LayoutGrid,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Trophy,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { ScrollArea } from '../components/ui/scroll-area'
import { PulseLoader } from '../components/ui/PulseLoader'
import { useAuth } from '../hooks/useAuth'
import { useRooms } from '../hooks/useRooms'

type WorkspaceTemplate = {
  title: string
  description: string
  icon: ReactNode
  defaultRoomName: string
  purpose: 'COLLABORATIVE' | 'COMPETING'
}

type StaticRoomPreview = {
  title: string
  roomType: string
  description: string
  badge: 'Free' | 'Paid'
}

type WorkspaceActionCardProps = {
  actionLabel?: string
  description: string
  icon: ReactNode
  onClick: () => void
  title: string
}

type FloatingErrorNotificationProps = {
  message: string | null
}

function FloatingErrorNotification({ message }: FloatingErrorNotificationProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="fixed right-4 top-4 z-[70] w-[min(14rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white/90 shadow-[0_12px_34px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-2.5">
        <span className="size-1.5 shrink-0 rounded-full bg-white/70" />
        <p className="min-w-0 truncate font-medium leading-5">{message}</p>
      </div>
      <div className="mt-2 h-px overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white/55"
          style={{ animation: 'dashboard-error-progress 3s linear forwards' }}
        />
      </div>
      <style>{`
        @keyframes dashboard-error-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
const topicOptions = [
  'Array',
  'String',
  'Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Queue',
  'Linked List',
  'Tree',
  'Graph',
  'Dynamic Programming',
  'Greedy',
  'Binary Search',
  'Sorting',
  'Math',
]



const workspaceTemplates: WorkspaceTemplate[] = [
  {
    title: 'Collaborative Room',
    description: 'Create a full workspace with chat, editor, and whiteboard.',
    defaultRoomName: 'Collaboration Room',
    purpose: 'COLLABORATIVE',
    icon: <MessageSquare size={16} aria-hidden="true" />,
  },
  {
    title: 'Competing Room',
    description: 'Create a coding room for practice, contests, and interview-style problem solving.',
    defaultRoomName: 'Contest Room',
    purpose: 'COMPETING',
    icon: <Trophy size={16} aria-hidden="true" />,
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
  'rounded-2xl bg-gradient-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 cursor-pointer'

const actionCardClassName =
  'relative flex h-full min-h-[7.25rem] flex-col justify-between overflow-hidden rounded-[14px] bg-[#18181B]/78 p-3.5 backdrop-blur-2xl transition duration-300 group-hover:bg-[#1F1F23]/88'

const iconBoxClassName =
  'grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-gradient-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#D6FFF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'

function WorkspaceActionCard({
  actionLabel = 'Create Room',
  description,
  icon,
  onClick,
  title,
}: WorkspaceActionCardProps) {
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
            {actionLabel}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </CardFooter>
      </Card>
    </button>
  )
}

function StaticRoomCard({
  onUseTemplate,
  room,
}: {
  onUseTemplate: () => void
  room: StaticRoomPreview
}) {
  return (
    <button
      type="button"
      onClick={onUseTemplate}
      className="group text-left cursor-pointer transition-transform duration-300 hover:-translate-y-0.5 w-full"
    >
      <Card className="flex min-h-[13rem] flex-col justify-between rounded-2xl border border-white/10 bg-[#060A12]/76 p-5 shadow-[0_18px_52px_rgba(0,0,0,0.2)] transition duration-300 group-hover:border-[#57F1DB]/25 group-hover:bg-[#090E17]/86">
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
                  ? 'border-amber-300/25 bg-amber-400/10 text-amber-200'
                  : 'bg-[#1F2937]/85 text-white',
              ].join(' ')}
            >
              {room.badge}
            </Badge>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#E5E7EB]">{room.description}</p>
        </div>
        <span
          className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full border border-[#57F1DB]/30 bg-[#57F1DB]/10 px-3.5 py-1.5 text-xs font-semibold text-[#D6FFF6] transition duration-300 group-hover:border-[#57F1DB]/50 group-hover:bg-[#57F1DB]/20"
        >
          Join room
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      </Card>
    </button>
  )
}

function RealRoomCard({
  membersCount,
  onClick,
  purpose,
  roomCode,
  roomName,
}: {
  membersCount: number
  onClick: () => void
  purpose?: 'COLLABORATIVE' | 'COMPETING'
  roomCode?: string
  roomName: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl bg-gradient-to-b from-[#5A5A5C]/70 via-white/12 to-[#28282A]/75 p-[2px] text-left shadow-[0_16px_48px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-0.5 cursor-pointer"
    >
      <Card className="flex h-full min-h-[9rem] flex-col justify-between rounded-[14px] bg-[#111316]/86 p-5 transition duration-300 group-hover:bg-[#181B1E]/92">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-[#F7F7F8]">{roomName}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className="border-[#57F1DB]/20 bg-[#57F1DB]/8 text-[10px] text-[#D6FFF6]">
                {purpose === 'COMPETING' ? 'Competing' : 'Collaborative'}
              </Badge>
              <span className="text-sm text-[#A7B8B3]">{membersCount} members</span>
            </div>
          </div>
          {roomCode ? (
            <Badge className="shrink-0 border-white/8 bg-white/[0.04] font-mono text-[10px] text-[#BACAC5]">
              {roomCode}
            </Badge>
          ) : null}
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 self-start rounded-xl border border-white/8 bg-black/18 px-3 py-1.5 text-xs font-semibold text-[#D6FFF6] transition group-hover:border-[#57F1DB]/35">
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
  const { createRoom, isLoadingRooms, joinRoom, roomError, rooms } = useRooms()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [useMemberLimit, setUseMemberLimit] = useState(false)
  const [creationStage, setCreationStage] = useState<'idle' | 'creating' | 'success'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const [joinRoomCode, setJoinRoomCode] = useState('')
  const [joinRoomError, setJoinRoomError] = useState<string | null>(null)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [staticRoomSearchQuery, setStaticRoomSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'home' | 'rooms'>('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)
  const [defaultRoomName, setDefaultRoomName] = useState('')
  const [createRoomPurpose, setCreateRoomPurpose] = useState<'COLLABORATIVE' | 'COMPETING'>('COLLABORATIVE')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')
  const [selectedDuration, setSelectedDuration] = useState(15)
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Array'])
  const [topicSearchQuery, setTopicSearchQuery] = useState('')
  const [roomPreviewPage, setRoomPreviewPage] = useState(1)

  const closeModal = () => {
    setIsCreateModalOpen(false)
    setUseMemberLimit(false)
    setCreationStage('idle')
    setFormError(null)
    setDefaultRoomName('')
    setCreateRoomPurpose('COLLABORATIVE')
    setSelectedDifficulty('MEDIUM')
    setSelectedDuration(15)
    setSelectedTopics(['Array'])
    setTopicSearchQuery('')
  }

  const closeJoinModal = () => {
    setIsJoinModalOpen(false)
    setJoinRoomCode('')
    setJoinRoomError(null)
    setIsJoiningRoom(false)
  }

  const openJoinModal = () => {
    setJoinRoomError(null)
    setIsJoinModalOpen(true)
  }

  useEffect(() => {
    if (!joinRoomError) return undefined

    const timeoutId = window.setTimeout(() => {
      setJoinRoomError(null)
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [joinRoomError])

  useEffect(() => {
    if (!formError) return undefined

    const timeoutId = window.setTimeout(() => {
      setFormError(null)
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [formError])

  const toggleTopic = (topic: string) => {
    setSelectedTopics((currentTopics) => {
      const topicAlreadySelected = currentTopics.includes(topic)

      if (topicAlreadySelected) {
        return currentTopics.filter((selectedTopic) => selectedTopic !== topic)
      }

      return [...currentTopics, topic]
    })
  }

  const openCreateModal = (roomName = '', purpose: 'COLLABORATIVE' | 'COMPETING' = 'COLLABORATIVE') => {
    setFormError(null)
    setDefaultRoomName(roomName)
    setCreateRoomPurpose(purpose)
    setSelectedDifficulty('MEDIUM')
    setSelectedDuration(15)
    setSelectedTopics(purpose === 'COMPETING' ? ['Array'] : [])
    setTopicSearchQuery('')
    setIsCreateModalOpen(true)
  }

  const handleJoinRoomSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setJoinRoomError(null)

    const trimmedRoomCode = joinRoomCode.trim()

    if (!trimmedRoomCode) {
      setJoinRoomError('Enter a room code first.')
      return
    }

    try {
      setIsJoiningRoom(true)
      const room = await joinRoom(trimmedRoomCode)
      closeJoinModal()
      navigate(`/rooms/${room.id}`, { state: { purpose: room.purpose } })
    } catch {
      setJoinRoomError('Check the room code and try again.')
    } finally {
      setIsJoiningRoom(false)
    }
  }

  const handleRoomSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setCreationStage('creating')

    const formData = new FormData(event.currentTarget)

    try {
      const roomName = String(formData.get('roomName') ?? '').trim()
      const maxMembersValue = Number(formData.get('maxMembers') ?? 0)

      if (!roomName) {
        setCreationStage('idle')
        setFormError('Add a room name.')
        return
      }

      if (useMemberLimit && (!Number.isFinite(maxMembersValue) || maxMembersValue < 2)) {
        setCreationStage('idle')
        setFormError('Use at least 2 members.')
        return
      }

      if (createRoomPurpose === 'COMPETING' && selectedTopics.length === 0) {
        setCreationStage('idle')
        setFormError('Select at least one topic.')
        return
      }

      const [room] = await Promise.all([
        createRoom({
          name: roomName,
          unlimitedMembers: !useMemberLimit,
          maxMembers: useMemberLimit ? maxMembersValue : null,
          purpose: createRoomPurpose,
          difficulty: createRoomPurpose === 'COMPETING' ? selectedDifficulty : undefined,
          topics: createRoomPurpose === 'COMPETING' ? selectedTopics : undefined,
          durationMinutes: createRoomPurpose === 'COMPETING' ? selectedDuration : undefined,
        }),
        new Promise((resolve) => setTimeout(resolve, 850)),
      ])

      setCreationStage('success')

      await new Promise((resolve) => setTimeout(resolve, 1600))

      closeModal()
      navigate(`/rooms/${room.id}`, { state: { purpose: room.purpose } })
    } catch {
      setCreationStage('idle')
      setFormError('Check the room details and try again.')
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

  const topicSearchText = topicSearchQuery.trim().toLowerCase()
  const filteredTopicOptions = topicOptions.filter((topic) => {
    if (!topicSearchText) {
      return true
    }

    return topic.toLowerCase().includes(topicSearchText)
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
        <div className="flex items-center justify-between border-b border-white/8 pb-6 w-full">
          <div className="flex min-w-0 items-center gap-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] shadow-lg shadow-black/30">
              <img src="/starsync-logo.png" alt="StarSync logo" className="h-9 w-9 rounded-full object-cover" />
            </span>
            <span
              className={[
                'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-24 opacity-100 ml-3',
              ].join(' ')}
            >
              <p className="text-sm font-bold uppercase tracking-wider text-[#F7F7F8]">StarSync</p>
            </span>
          </div>

          {isMobileSidebar ? (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="grid size-8 place-items-center rounded-lg text-[#8D9B97] transition hover:bg-white/5 hover:text-white lg:hidden cursor-pointer"
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
                  'flex w-full items-center rounded-xl border text-sm font-medium transition-all duration-300 cursor-pointer px-3.5 py-3 gap-0',
                  isActive
                    ? 'border-r-2 border-[#57F1DB] border-y-white/8 border-l-white/8 bg-white/[0.055] text-[#D6FFF6]'
                    : 'border-transparent text-[#95A5A0] hover:border-white/8 hover:bg-white/[0.035] hover:text-white',
                ].join(' ')}
              >
                <span className="shrink-0">{item.icon}</span>
                <span
                  className={[
                    'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                    isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-24 opacity-100 ml-3',
                  ].join(' ')}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/8 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={logout}
            className="w-full px-3.5 py-2.5 text-xs cursor-pointer transition-all duration-300 ease-in-out !justify-start gap-0"
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className="shrink-0">
              <LogOut size={14} aria-hidden="true" />
            </span>
            <span
              className={[
                'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-12 opacity-100 ml-2',
              ].join(' ')}
            >
              Logout
            </span>
          </Button>
        </div>

        {!isMobileSidebar ? (
          <button
            type="button"
            onClick={toggleDesktopSidebar}
            className="absolute right-0 top-1/2 z-[80] grid size-9 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/12 bg-[#141820] text-[#D6FFF6] shadow-xl shadow-black/45 transition hover:border-[#57F1DB]/45 hover:bg-[#1C232A] cursor-pointer"
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
                className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-[#95A5A0] transition hover:text-white lg:hidden cursor-pointer"
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
              className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-[#BACAC5] transition hover:border-[#57F1DB]/35 hover:text-white cursor-pointer"
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

                <section className="grid gap-4 md:grid-cols-3">
                  <WorkspaceActionCard
                    title="Join Room"
                    description="Enter a room code to open an existing workspace."
                    icon={<Hash size={16} aria-hidden="true" />}
                    actionLabel="Enter Code"
                    onClick={openJoinModal}
                  />

                  {workspaceTemplates.map((template) => (
                    <WorkspaceActionCard
                      key={template.title}
                      title={template.title}
                      description={template.description}
                      icon={template.icon}
                      onClick={() => openCreateModal(template.defaultRoomName, template.purpose)}
                    />
                  ))}
                </section>
<section className="mt-8 space-y-5">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-[#F7F7F8]">Room Examples</h3>
                  </div>
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
                      {visibleStaticRoomPreviews.map((room) => {
                        const isCompetingTemplate = room.roomType === 'Competitive Room'

                        return (
                          <StaticRoomCard
                            key={room.title}
                            room={room}
                            onUseTemplate={() =>
                              openCreateModal(
                                room.title,
                                isCompetingTemplate ? 'COMPETING' : 'COLLABORATIVE',
                              )
                            }
                          />
                        )
                      })}
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
                      className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#8D9B97] transition hover:text-[#F7F7F8] cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
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
                            'grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold transition cursor-pointer',
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
                      className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#F7F7F8] transition hover:text-[#D6FFF6] cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
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
                  <h2 className="text-3xl font-semibold tracking-tight text-[#F7F7F8] sm:text-4xl">Your Rooms</h2>
                  <p className="mt-3 text-sm leading-6 text-[#BACAC5] sm:text-base">
                    Search, manage, and open your joined workspaces.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <div className="min-w-24 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#859490]">
                        Created
                      </span>
                      <span className="mt-1 block font-mono text-lg font-bold leading-none text-[#D6FFF6]">
                        {createdRoomsCount}
                      </span>
                    </div>
                    <div className="min-w-24 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#859490]">
                        Joined
                      </span>
                      <span className="mt-1 block font-mono text-lg font-bold leading-none text-[#D6FFF6]">
                        {joinedRoomsCount}
                      </span>
                    </div>
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
                    <PulseLoader className="bg-white/[0.03]" />
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
                          purpose={room.purpose}
                          roomCode={room.joinCode}
                          membersCount={room._count?.members ?? 0}
                          onClick={() => navigate(`/rooms/${room.id}`, { state: { purpose: room.purpose } })}
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
            'relative z-40 flex h-full shrink-0 flex-col overflow-visible border-r border-white/8 bg-[#07090A]/92 shadow-2xl shadow-black/35 backdrop-blur-2xl transition-[width] duration-300 px-3.5 py-5',
            isDesktopSidebarCollapsed ? 'w-[5rem]' : 'w-48',
          ].join(' ')}
        >
          {renderSidebarContent(isDesktopSidebarCollapsed, false)}
        </aside>

        {renderMainContent(false)}
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:hidden">{renderMainContent(true)}</div>

      <Modal
        isOpen={isJoinModalOpen}
        onClose={closeJoinModal}
        title="Join Room"
        size="lg"
        hideHeader
        className="relative overflow-visible rounded-[28px] border border-white/10 bg-black/50 p-5 shadow-[0_26px_80px_rgba(0,0,0,0.58)]"
      >
        <FloatingErrorNotification message={joinRoomError} />

        <div className="rounded-[20px] border border-white/16 bg-gradient-to-b from-[#303033]/95 via-[#242426]/95 to-[#202022]/95 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_55px_rgba(0,0,0,0.32)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-[#F4F4F5]">Join Room</h2>
            <button
              type="button"
              onClick={closeJoinModal}
              className="grid size-9 cursor-pointer place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleJoinRoomSubmit} className="mx-auto grid max-w-[21rem] justify-items-center gap-4 text-center">
            <label className="grid w-full justify-items-center text-sm text-zinc-400">
              <div className="w-full rounded-xl border border-white/18 bg-[#2B2B2E]/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-400">
                  Room Code
                </span>
                <Input
                  value={joinRoomCode}
                  onChange={(event) => {
                    setJoinRoomCode(event.target.value.toUpperCase())
                    setJoinRoomError(null)
                  }}
                  placeholder="RM-ABC123"
                  autoFocus
                  className="mt-2 h-8 border-0 bg-transparent p-0 text-center text-lg font-bold tracking-[0.12em] text-[#D6FFF6] shadow-none placeholder:text-zinc-500 focus-visible:border-0 focus-visible:ring-0"
                />
              </div>
            </label>

            <Button
              type="submit"
              disabled={isJoiningRoom}
              variant="ghost"
              className="h-11 rounded-full border-2 border-white/10 bg-transparent px-7 text-base font-semibold text-white shadow-[0_10px_28px_rgba(0,0,0,0.22)] hover:border-white/22 hover:bg-white/8 hover:text-white"
            >
              {isJoiningRoom ? 'Joining...' : 'Enter Code'}
            </Button>
          </form>
        </div>
      </Modal>
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeModal}
        title={createRoomPurpose === 'COMPETING' ? 'Create Competing Room' : 'Collaboration Room'}
        size="lg"
        hideHeader
        className="rounded-[28px] border border-white/10 bg-black/50 p-5 shadow-[0_26px_80px_rgba(0,0,0,0.58)]"
      >
        <FloatingErrorNotification message={formError} />

        <div className="rounded-[20px] border border-white/16 bg-gradient-to-b from-[#303033]/95 via-[#242426]/95 to-[#202022]/95 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_55px_rgba(0,0,0,0.32)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-[#F4F4F5]">
              {createRoomPurpose === 'COMPETING' ? 'Create Competing Room' : 'Collaboration Room'}
            </h2>
            <button
              type="button"
              onClick={closeModal}
              className="grid size-9 cursor-pointer place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleRoomSubmit} className="grid gap-4">
          <label className="grid gap-2 text-sm text-zinc-300">
            Room name
            <Input name="roomName" placeholder="DSA Study Group" defaultValue={defaultRoomName} autoFocus className="h-11 rounded-xl border-white/18 bg-[#161618]/70 px-4 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-white/45 focus-visible:ring-white/12" />
          </label>

          {createRoomPurpose === 'COMPETING' ? (
            <div className="grid gap-4 rounded-2xl border border-white/14 bg-[#171719]/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="grid gap-2">
                <p className="text-sm font-medium text-white">Difficulty</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['EASY', 'MEDIUM', 'HARD'] as const).map((difficulty) => {
                    const isSelected = selectedDifficulty === difficulty
                    const activeColorClass =
                      difficulty === 'EASY'
                        ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300'
                        : difficulty === 'MEDIUM'
                        ? 'border-amber-500/40 bg-amber-500/12 text-amber-300'
                        : 'border-rose-500/40 bg-rose-500/12 text-rose-300'

                    return (
                      <button
                        key={difficulty}
                        type="button"
                        onClick={() => setSelectedDifficulty(difficulty)}
                        className={[
                          'rounded-lg border px-3 py-2 text-sm font-semibold transition cursor-pointer',
                          isSelected
                            ? activeColorClass
                            : 'border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-white',
                        ].join(' ')}
                      >
                        {difficulty[0] + difficulty.slice(1).toLowerCase()}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-medium text-white">Topics</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
                      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/14 bg-[#111113]/70 px-3 py-2 text-left text-sm text-white outline-none transition hover:border-white/24 focus:border-[#57F1DB]/35"
                    >
                      <span className="flex max-h-9 min-w-0 flex-1 flex-wrap items-center gap-2 overflow-y-auto pr-1">
                        {selectedTopics.length ? (
                          selectedTopics.map((topic) => (
                            <Badge
                              key={topic}
                              className="gap-1 rounded-full border-[#57F1DB]/30 bg-[#57F1DB]/12 px-2.5 py-1 text-xs text-[#D6FFF6]"
                            >
                              {topic}
                              <span
                                role="button"
                                tabIndex={0}
                                aria-label={`Remove ${topic}`}
                                className="rounded-full text-[#A7B8B3] transition hover:text-white cursor-pointer"
                                onPointerDown={(event) => {
                                  event.stopPropagation()
                                }}
                                onMouseDown={(event) => {
                                  event.stopPropagation()
                                }}
                                onTouchStart={(event) => {
                                  event.stopPropagation()
                                }}
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  toggleTopic(topic)
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    toggleTopic(topic)
                                  }
                                }}
                              >
                                <X size={12} aria-hidden="true" />
                              </span>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-zinc-500">Select topics...</span>
                        )}
                      </span>
                      <ChevronDown size={16} className="shrink-0 text-zinc-500" aria-hidden="true" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="z-[80] w-[min(var(--radix-dropdown-menu-trigger-width),28rem)] overflow-hidden rounded-xl border-white/14 bg-[#0D0E10]/98 p-0 text-white shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                      <Search size={15} className="text-zinc-500" aria-hidden="true" />
                      <input
                        value={topicSearchQuery}
                        onChange={(event) => setTopicSearchQuery(event.target.value)}
                        onKeyDown={(event) => event.stopPropagation()}
                        placeholder="Search topics..."
                        className="h-8 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                      />
                    </div>
                    <ScrollArea className="h-36">
                      <div className="p-1">
                        {filteredTopicOptions.length ? (
                          filteredTopicOptions.map((topic) => {
                            const isSelected = selectedTopics.includes(topic)

                            return (
                              <DropdownMenuItem
                                key={topic}
                                onSelect={(event) => {
                                  event.preventDefault()
                                  toggleTopic(topic)
                                }}
                                className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-300 focus:bg-[#57F1DB]/10 focus:text-[#D6FFF6]"
                              >
                                <span>{topic}</span>
                                {isSelected ? <Check size={15} className="text-[#57F1DB]" aria-hidden="true" /> : null}
                              </DropdownMenuItem>
                            )
                          })
                        ) : (
                          <p className="px-3 py-3 text-sm text-zinc-500">No topics found.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

            </div>
          ) : null}

          <div className="grid gap-2.5 rounded-2xl border border-white/14 bg-[#171719]/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-sm font-medium text-white">Member limit</p>
            <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer select-none">
              <input
                type="radio"
                name="memberLimitMode"
                checked={!useMemberLimit}
                onChange={() => setUseMemberLimit(false)}
                className="mt-1 cursor-pointer"
              />
              <span>
                Unlimited

              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer select-none">
              <input
                type="radio"
                name="memberLimitMode"
                checked={useMemberLimit}
                onChange={() => setUseMemberLimit(true)}
                className="mt-1 cursor-pointer"
              />
              <span className="grid flex-1 gap-1.5">
                Limit members
                <Input name="maxMembers" type="number" min="2" defaultValue="10" disabled={!useMemberLimit} className="h-10 rounded-xl border-white/18 bg-[#161618]/70 px-4 text-zinc-100 disabled:opacity-45" />

              </span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={creationStage !== 'idle'}
            className={[
              'mx-auto h-11 min-w-36 rounded-full border-2 border-white/10 bg-transparent px-7 text-base font-semibold text-white shadow-none transition-all duration-300 hover:border-white/22 hover:bg-white/8 hover:text-white focus-visible:border-white/35 focus-visible:ring-white/12 cursor-pointer disabled:cursor-not-allowed',
            ].join(' ')}
          >
            {creationStage === 'creating' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
                Creating Room...
              </span>
            ) : creationStage === 'success' ? (
              <span className="flex items-center justify-center gap-2 animate-bounce">
                <Check className="h-4 w-4" aria-hidden="true" />
                Room created! {createRoomPurpose === 'COMPETING' ? "Let's compete!" : "Let's collab!"}
              </span>
            ) : (
              'Create Room'
            )}
          </Button>
          </form>
        </div>
      </Modal>
    </section>
  )
}
