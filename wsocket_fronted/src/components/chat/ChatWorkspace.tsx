import { LogOut, Palette, Plus, Trash2 } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { useChatSocket } from '../../hooks/useChatSocket'
import { useRooms } from '../../hooks/useRooms'
import { roomMemberService } from '../../services/roomMemberService'
import type { RoomMember } from '../../types/chat'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { MessageInput } from './MessageInput'
import { ChatWorkspaceSkeleton } from './ChatWorkspaceSkeleton'
import { MessageList } from './MessageList'
import { TypingIndicator } from './TypingIndicator'
import { OnlineUsersPanel } from './OnlineUsersPanel'
import { RoomHeader } from './RoomHeader'
import { RoomSidebar } from './RoomSidebar'
import { EditorSkeleton } from '../editor/EditorSkeleton'

type ChatWorkspaceProps = {
  roomId: string | undefined
}

type ResizablePanelSide = 'left' | 'right'

const LEFT_PANEL_DEFAULT_WIDTH = 360
const LEFT_PANEL_MIN_WIDTH = 280
const LEFT_PANEL_MAX_WIDTH = 430

const RIGHT_PANEL_DEFAULT_WIDTH = 392
const RIGHT_PANEL_MIN_WIDTH = 300
const RIGHT_PANEL_MAX_WIDTH = 460
const MAIN_CHAT_MIN_WIDTH = 540
const DESKTOP_PANEL_BREAKPOINT = 1280
const COMFORTABLE_DETAILS_BREAKPOINT = 1536

const LazyCodeEditorWorkspace = lazy(() =>
  import('../editor/CodeEditorWorkspace').then((module) => ({
    default: module.CodeEditorWorkspace,
  }))
)

const clampPanelWidth = (width: number, minWidth: number, maxWidth: number) => {
  return Math.min(Math.max(width, minWidth), maxWidth)
}

const readSavedPanelWidth = (storageKey: string, fallbackWidth: number, minWidth: number, maxWidth: number) => {
  if (typeof window === 'undefined') {
    return fallbackWidth
  }

  const savedWidth = Number(window.localStorage.getItem(storageKey))

  if (!Number.isFinite(savedWidth)) {
    return fallbackWidth
  }

  return clampPanelWidth(savedWidth, minWidth, maxWidth)
}

export function ChatWorkspace({ roomId }: ChatWorkspaceProps) {
  const workspaceRef = useRef<HTMLElement | null>(null)
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const {
    createDm,
    createRoom,
    deleteRoom,
    dmRooms,
    getRoom,
    isLoadingRooms,
    markRoomRead,
    rooms,
    updateRoom,
  } = useRooms()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia(`(min-width: ${DESKTOP_PANEL_BREAKPOINT}px)`).matches
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia(`(min-width: ${DESKTOP_PANEL_BREAKPOINT}px)`).matches
  })
  const [activeTab, setActiveTab] = useState<'chat' | 'editor' | 'whiteboard'>('chat')
  const [leftPanelWidth, setLeftPanelWidth] = useState(() =>
    readSavedPanelWidth('ws-chat-left-panel-width', LEFT_PANEL_DEFAULT_WIDTH, LEFT_PANEL_MIN_WIDTH, LEFT_PANEL_MAX_WIDTH)
  )
  const [rightPanelWidth, setRightPanelWidth] = useState(() =>
    readSavedPanelWidth('ws-chat-right-panel-width', RIGHT_PANEL_DEFAULT_WIDTH, RIGHT_PANEL_MIN_WIDTH, RIGHT_PANEL_MAX_WIDTH)
  )

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_PANEL_BREAKPOINT}px)`)

    const syncPanelsForViewport = () => {
      if (!desktopQuery.matches) {
        setIsSidebarOpen(false)
        setIsInfoOpen(false)
        return
      }

      setIsSidebarOpen(true)
      setIsInfoOpen(window.innerWidth >= COMFORTABLE_DETAILS_BREAKPOINT)
    }

    const handleDesktopBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        syncPanelsForViewport()
        return
      }

      setIsSidebarOpen(false)
      setIsInfoOpen(false)
    }

    const handleWindowResize = () => {
      if (!desktopQuery.matches) return

      if (window.innerWidth < COMFORTABLE_DETAILS_BREAKPOINT) {
        setIsInfoOpen(false)
      }
    }

    syncPanelsForViewport()
    desktopQuery.addEventListener('change', handleDesktopBreakpointChange)
    window.addEventListener('resize', handleWindowResize)

    return () => {
      desktopQuery.removeEventListener('change', handleDesktopBreakpointChange)
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('ws-chat-left-panel-width', String(leftPanelWidth))
  }, [leftPanelWidth])

  useEffect(() => {
    window.localStorage.setItem('ws-chat-right-panel-width', String(rightPanelWidth))
  }, [rightPanelWidth])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.innerWidth < DESKTOP_PANEL_BREAKPOINT) {
      setIsSidebarOpen(false)
      setIsInfoOpen(false)
    }
  }, [activeTab])

  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [roomActionError, setRoomActionError] = useState<string | null>(null)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([])
  const activeRoom = getRoom(roomId)
  const isAdmin = Boolean(user?.id && activeRoom?.adminId === user.id)
  const activeRoomDisplay = activeRoom ? getRoomDisplayInfo(activeRoom) : null

  const {
    connectionStatus,
    editorPresenceUsers,
    hasMoreMessages,
    isLoadingHistory,
    isLoadingOlder,
    lastEditorSync,
    loadOlderMessages,
    messages,
    onlineUsers,
    retryMessage,
    sendEditorChange,
    sendEditorPresence,
    sendMessage,
    sendStopTyping,
    sendTyping,
    typingUsers,
  } = useChatSocket(activeRoom?.id ?? '', user?.id)
  const visibleMemberCount = roomMembers.length || activeRoom?._count?.members || 0

  useEffect(() => {
    let isCurrentRequest = true

    setMembersError(null)
    setRoomMembers([])

    if (!activeRoom?.id) {
      return
    }

    const loadMembers = async () => {
      try {
        setIsLoadingMembers(true)
        const members = await roomMemberService.list(activeRoom.id)

        if (isCurrentRequest) {
          setRoomMembers(members)
        }
      } catch {
        if (isCurrentRequest) {
          setMembersError('Members could not be loaded.')
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoadingMembers(false)
        }
      }
    }

    void loadMembers()

    return () => {
      isCurrentRequest = false
    }
  }, [activeRoom?.id])

  useEffect(() => {
    markRoomRead(activeRoom?.id)
  }, [activeRoom?.id, messages.length, markRoomRead])

  useEffect(() => {
    if (!activeRoom?.id || connectionStatus !== 'online') {
      return
    }

    const nextEditorStatus = activeTab === 'editor' ? 'active' : 'inactive'
    sendEditorPresence(nextEditorStatus)

    return () => {
      if (activeTab === 'editor') {
        sendEditorPresence('inactive')
      }
    }
  }, [activeRoom?.id, activeTab, connectionStatus, sendEditorPresence])

  if (isLoadingRooms) {
    return <ChatWorkspaceSkeleton />
  }

  if (!activeRoom) {
    return <Navigate to="/dashboard" replace />
  }

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '')
    const room = await createRoom(name)

    if (room) {
      setIsCreateModalOpen(false)
      navigate(`/rooms/${room.id}`)
    }
  }

  const handleRenameRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRoomActionError(null)
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '')

    try {
      const room = await updateRoom(activeRoom.id, name)
      setIsSettingsOpen(false)
      navigate(`/rooms/${room.id}`, { replace: true })
    } catch {
      setRoomActionError('Room could not be renamed. Check ownership and try another name.')
    }
  }

  const handleDeleteRoom = async () => {
    setRoomActionError(null)

    try {
      await deleteRoom(activeRoom.id)
      setIsDeleteConfirmOpen(false)
      setIsSettingsOpen(false)
      navigate('/dashboard', { replace: true })
    } catch {
      setRoomActionError('Room could not be deleted. Only the room admin can delete it.')
    }
  }

  const handleLeaveRoom = () => {
    setIsSettingsOpen(false)
    navigate('/dashboard', { replace: true })
  }

  const handlePanelResizeStart = (side: ResizablePanelSide, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (window.innerWidth < DESKTOP_PANEL_BREAKPOINT) {
      return
    }

    event.preventDefault()

    if (side === 'left') {
      setIsSidebarOpen(true)
    } else {
      setIsInfoOpen(true)
    }

    const workspaceElement = workspaceRef.current

    if (!workspaceElement) {
      return
    }

    const workspaceBounds = workspaceElement.getBoundingClientRect()
    const availableWorkspaceWidth = workspaceBounds.width
    const otherPanelWidth = side === 'left'
      ? (isInfoOpen ? rightPanelWidth : 0)
      : (isSidebarOpen ? leftPanelWidth : 0)
    const resizeRailsWidth = 24
    const maximumWidthThatKeepsChatReadable = Math.max(
      side === 'left' ? LEFT_PANEL_MIN_WIDTH : RIGHT_PANEL_MIN_WIDTH,
      availableWorkspaceWidth - otherPanelWidth - MAIN_CHAT_MIN_WIDTH - resizeRailsWidth,
    )

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      if (side === 'left') {
        const nextLeftWidth = pointerEvent.clientX - workspaceBounds.left
        const safeLeftWidth = clampPanelWidth(
          nextLeftWidth,
          LEFT_PANEL_MIN_WIDTH,
          Math.min(LEFT_PANEL_MAX_WIDTH, maximumWidthThatKeepsChatReadable),
        )

        setLeftPanelWidth(safeLeftWidth)
        return
      }

      const nextRightWidth = workspaceBounds.right - pointerEvent.clientX
      const safeRightWidth = clampPanelWidth(
        nextRightWidth,
        RIGHT_PANEL_MIN_WIDTH,
        Math.min(RIGHT_PANEL_MAX_WIDTH, maximumWidthThatKeepsChatReadable),
      )

      setRightPanelWidth(safeRightWidth)
    }

    const stopResizing = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResizing)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResizing)
  }

  return (
    <section
      ref={workspaceRef}
      className="relative flex h-dvh max-h-dvh w-full overflow-hidden xl:flex-row"
    >
      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 xl:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      ) : null}

      {isInfoOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 xl:hidden"
          onClick={() => setIsInfoOpen(false)}
          aria-label="Close details overlay"
        />
      ) : null}

      {!isSidebarOpen ? (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed inset-y-0 left-0 z-30 flex w-4 items-center justify-center bg-[#05080A]/70 backdrop-blur-md transition hover:w-6 hover:bg-[#18D6A3]/10 xl:hidden"
          aria-label="Open room sidebar"
        >
          <span className="h-28 w-1 rounded-full bg-[#18D6A3]/55 shadow-[0_0_18px_rgba(24,214,163,0.45)]" />
        </button>
      ) : null}

      {!isInfoOpen ? (
        <button
          type="button"
          onClick={() => setIsInfoOpen(true)}
          className="fixed inset-y-0 right-0 z-30 flex w-4 items-center justify-center bg-[#05080A]/70 backdrop-blur-md transition hover:w-6 hover:bg-[#18D6A3]/10 xl:hidden"
          aria-label="Open room details"
        >
          <span className="h-28 w-1 rounded-full bg-[#18D6A3]/55 shadow-[0_0_18px_rgba(24,214,163,0.45)]" />
        </button>
      ) : null}

      <RoomSidebar
        activeRoom={activeRoom}
        activeRoomId={activeRoom.id}
        activeTab={activeTab}
        dmRooms={dmRooms}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onlineUsers={onlineUsers}
        onCreateDm={createDm}
        onCreateRoom={() => setIsCreateModalOpen(true)}
        onLogout={logout}
        onSelectRoom={(nextRoomId) => navigate(`/rooms/${nextRoomId}`)}
        onTabChange={setActiveTab}
        panelWidth={leftPanelWidth}
        rooms={rooms}
        user={user}
      />

      <button
        type="button"
        onPointerDown={(event) => handlePanelResizeStart('left', event)}
        onDoubleClick={() => setIsSidebarOpen((current) => !current)}
        className={[
          'group relative hidden w-2 shrink-0 cursor-col-resize items-stretch justify-center bg-[#05080A] transition hover:bg-[#18D6A3]/8 xl:flex',
          'before:absolute before:inset-y-0 before:left-1/2 before:w-5 before:-translate-x-1/2 before:content-[""]',
          isSidebarOpen ? 'border-r border-white/10' : 'border-r border-[#18D6A3]/20',
        ].join(' ')}
        aria-label={isSidebarOpen ? 'Resize or double click to hide sidebar' : 'Drag or double click to show sidebar'}
      >
        <span className="my-5 block w-px rounded-full bg-white/10 transition group-hover:w-1 group-hover:bg-[#18D6A3]/70" />
      </button>

      <div className="neon-field relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#09090B]">
        <RoomHeader
          connectionStatus={connectionStatus}
          isAdmin={isAdmin}
          isInfoOpen={isInfoOpen}
          memberCount={visibleMemberCount}
          room={activeRoom}
          onOpenSettings={() => {
            setRoomActionError(null)
            setIsSettingsOpen(true)
          }}
          onToggleInfo={() => {
            if (window.innerWidth < DESKTOP_PANEL_BREAKPOINT) {
              setIsInfoOpen(true)
              return
            }

            setIsInfoOpen((current) => !current)
          }}
        />
        {activeTab === 'chat' && (
          <>
            <div className="min-h-0 flex-1 overflow-hidden">
              <MessageList
                connectionStatus={connectionStatus}
                hasMoreMessages={hasMoreMessages}
                isLoadingHistory={isLoadingHistory}
                isLoadingOlder={isLoadingOlder}
                messages={messages}
                onLoadOlderMessages={loadOlderMessages}
                onRetryMessage={retryMessage}
              />
            </div>
            <TypingIndicator typingUsers={typingUsers} />
            <MessageInput
              disabled={connectionStatus !== 'online'}
              roomName={activeRoomDisplay?.displayName ?? activeRoom.name}
              onStopTyping={sendStopTyping}
              onTyping={sendTyping}
              onSend={sendMessage}
            />
          </>
        )}

        {activeTab === 'editor' && (
          <Suspense fallback={<EditorSkeleton />}>
            <LazyCodeEditorWorkspace
              connectionStatus={connectionStatus}
              currentUser={user}
              lastEditorSync={lastEditorSync}
              activeCollaborators={editorPresenceUsers}
              room={activeRoom}
              onEditorChange={sendEditorChange}
            />
          </Suspense>
        )}

        {activeTab === 'whiteboard' && (
          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center select-none">
            <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,rgba(245,158,11,0.22)_1px,transparent_0)] [background-size:16px_16px]" />
            <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-xl backdrop-blur-md">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl border border-[#F59E0B]/25 bg-[#F59E0B]/12 text-[#F59E0B] shadow-lg shadow-[#F59E0B]/10">
                <Palette size={22} aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-white">Shared Sketch Canvas</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                An interactive vector whiteboard for design blueprints and diagrams will be integrated here in the next update.
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onPointerDown={(event) => handlePanelResizeStart('right', event)}
        onDoubleClick={() => setIsInfoOpen((current) => !current)}
        className={[
          'group relative hidden w-2 shrink-0 cursor-col-resize items-stretch justify-center bg-[#05080A] transition hover:bg-[#18D6A3]/8 xl:flex',
          'before:absolute before:inset-y-0 before:left-1/2 before:w-5 before:-translate-x-1/2 before:content-[""]',
          isInfoOpen ? 'border-l border-white/10' : 'border-l border-[#18D6A3]/20',
        ].join(' ')}
        aria-label={isInfoOpen ? 'Resize or double click to hide room details' : 'Drag or double click to show room details'}
      >
        <span className="my-5 block w-px rounded-full bg-white/10 transition group-hover:w-1 group-hover:bg-[#18D6A3]/70" />
      </button>

      <OnlineUsersPanel
        activeTab={activeTab}
        isOpen={isInfoOpen}
        isLoadingMembers={isLoadingMembers}
        membersError={membersError}
        onClose={() => setIsInfoOpen(false)}
        onlineUsers={onlineUsers}
        editorPresenceUsers={editorPresenceUsers}
        panelWidth={rightPanelWidth}
        room={activeRoom}
        roomMembers={roomMembers}
      />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create room"
      >
        <form onSubmit={handleCreateRoom} className="grid gap-4">
          <Input name="name" placeholder="Room name" autoFocus />
          <Button type="submit">
            <Plus size={17} aria-hidden="true" />
            Create room
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Room settings"
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-white/8 bg-white/4 p-3">
            <p className="text-sm font-semibold text-white">
              {activeRoomDisplay?.displayName ?? activeRoom.name}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {activeRoomDisplay?.subtitle ?? `#${activeRoom.slug}`}
            </p>
          </div>

          {isAdmin ? (
            <form onSubmit={handleRenameRoom} className="grid gap-3">
              <label className="grid gap-2 text-sm text-zinc-300">
                Rename room
                <Input name="name" defaultValue={activeRoom.name} placeholder="Room name" />
              </label>
              <Button type="submit">Save changes</Button>
            </form>
          ) : (
            <p className="rounded-lg border border-white/8 bg-white/4 p-3 text-sm text-zinc-400">
              Only the room admin can rename or delete this room.
            </p>
          )}

          {roomActionError ? (
            <p className="rounded-lg border border-red-300/20 bg-red-950/20 p-3 text-sm text-red-200">
              {roomActionError}
            </p>
          ) : null}

          <div className="grid gap-2 border-t border-white/8 pt-4">
            <Button type="button" variant="ghost" onClick={handleLeaveRoom}>
              <LogOut size={16} aria-hidden="true" />
              Leave room
            </Button>
            {isAdmin ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="border-red-300/20 text-red-200 hover:bg-red-950/30 hover:text-red-100"
              >
                <Trash2 size={16} aria-hidden="true" />
                Delete room
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete room"
      >
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-zinc-300">
            Delete <span className="font-semibold text-white">{activeRoom.name}</span>? This removes the room and its messages for everyone.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleDeleteRoom}
              className="border-red-300/20 text-red-200 hover:bg-red-950/30 hover:text-red-100"
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete room
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
