import { LogOut, Trash2, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { MessageInput } from './MessageInput'
import { ChatWorkspaceSkeleton } from './ChatWorkspaceSkeleton'
import { MessageList } from './MessageList'
import { TypingIndicator } from './TypingIndicator'
import { OnlineUsersPanel } from './OnlineUsersPanel'
import { RoomHeader } from './RoomHeader'
import { RoomSidebar } from './RoomSidebar'
import { EditorSkeleton } from '../editor/EditorSkeleton'
import { WhiteboardSkeleton } from '../whiteboard/WhiteboardSkeleton'

type ChatWorkspaceProps = {
  roomId: string | undefined
}

const DESKTOP_PANEL_BREAKPOINT = 1280
const COMFORTABLE_DETAILS_BREAKPOINT = 1536

const LazyCodeEditorWorkspace = lazy(() =>
  import('../editor/CodeEditorWorkspace').then((module) => ({
    default: module.CodeEditorWorkspace,
  }))
)

const LazyWhiteboardWorkspace = lazy(() =>
  import('../whiteboard/WhiteboardWorkspace').then((module) => ({
    default: module.WhiteboardWorkspace,
  }))
)

export function ChatWorkspace({ roomId }: ChatWorkspaceProps) {
  const workspaceRef = useRef<HTMLElement | null>(null)
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const {
    createDm,
    deleteRoom,
    dmRooms,
    getRoom,
    isLoadingRooms,
    markRoomRead,
    rooms,
    updateRoom,
  } = useRooms()

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
  const [whiteboardCollaborators, setWhiteboardCollaborators] = useState<
    { id: string; username: string; email: string }[]
  >([])

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
    loadOlderMessages,
    messages,
    onlineUsers,
    retryMessage,
    sendEditorPresence,
    sendMessage,
    sendStopTyping,
    sendTyping,
    typingUsers,
  } = useChatSocket(activeRoom?.id ?? '', user?.id)

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



  const handleRenameRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRoomActionError(null)
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '')

    try {
      const room = await updateRoom(activeRoom.id, { name })
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

      <ResizablePanelGroup
        direction="horizontal"
        id="starsync-room-layout"
        className="relative z-0 min-h-0 min-w-0 flex-1"
      >
        {isSidebarOpen ? (
          <>
            <ResizablePanel
              id="room-sidebar"
              defaultSize="22%"
              minSize="18%"
              maxSize="30%"
              className="contents xl:block"
            >
              <RoomSidebar
                activeRoom={activeRoom}
                activeRoomId={activeRoom.id}
                activeTab={activeTab}
                dmRooms={dmRooms}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onlineUsers={onlineUsers}
                onCreateDm={createDm}
                onLogout={logout}
                onSelectRoom={(nextRoomId) => navigate(`/rooms/${nextRoomId}`)}
                onTabChange={setActiveTab}
                rooms={rooms.filter((room) => room.purpose === 'COLLABORATIVE')}
                user={user}
              />
            </ResizablePanel>
            <ResizableHandle className="hidden border-r border-white/10 xl:flex" withHandle />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="group relative hidden w-2 shrink-0 items-stretch justify-center border-r border-[#18D6A3]/20 bg-[#05080A] transition hover:bg-[#18D6A3]/8 xl:flex"
            aria-label="Open room sidebar"
          >
            <span className="my-5 block w-px rounded-full bg-white/10 transition group-hover:w-1 group-hover:bg-[#18D6A3]/70" />
          </button>
        )}

        <ResizablePanel
          id="room-workspace"
          defaultSize={isInfoOpen ? '54%' : '78%'}
          minSize="44%"
          className="min-w-0"
        >
          <div className="neon-field relative z-0 flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#09090B]">
            <RoomHeader
              connectionStatus={connectionStatus}
              isInfoOpen={isInfoOpen}
              room={activeRoom}
              activeCollaborators={
                activeTab === 'whiteboard'
                  ? whiteboardCollaborators
                  : activeTab === 'editor'
                  ? editorPresenceUsers
                  : undefined
              }
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
                  activeCollaborators={editorPresenceUsers}
                  room={activeRoom}
                />
              </Suspense>
            )}

            {activeTab === 'whiteboard' && (
              <Suspense fallback={<WhiteboardSkeleton />}>
                <LazyWhiteboardWorkspace
                  room={activeRoom}
                  currentUser={user}
                  onCollaboratorsChange={setWhiteboardCollaborators}
                />
              </Suspense>
            )}
          </div>
        </ResizablePanel>

        {isInfoOpen ? (
          <>
            <ResizableHandle className="hidden border-l border-white/10 xl:flex" withHandle />
            <ResizablePanel
              id="room-details"
              defaultSize="24%"
              minSize="18%"
              maxSize="32%"
              className="contents xl:block"
            >
              <OnlineUsersPanel
                currentUserId={user?.id}
                isCurrentUserAdmin={isAdmin}
                isOpen={isInfoOpen}
                isLoadingMembers={isLoadingMembers}
                membersError={membersError}
                onClose={() => setIsInfoOpen(false)}
                onlineUsers={onlineUsers}
                room={activeRoom}
                roomMembers={roomMembers}
              />
            </ResizablePanel>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            className="group relative hidden w-2 shrink-0 items-stretch justify-center border-l border-[#18D6A3]/20 bg-[#05080A] transition hover:bg-[#18D6A3]/8 xl:flex"
            aria-label="Open room details"
          >
            <span className="my-5 block w-px rounded-full bg-white/10 transition group-hover:w-1 group-hover:bg-[#18D6A3]/70" />
          </button>
        )}
      </ResizablePanelGroup>



      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Room settings"
        size="lg"
        hideHeader
        className="relative overflow-visible rounded-[28px] border border-white/10 bg-black/50 p-5 shadow-[0_26px_80px_rgba(0,0,0,0.58)]"
      >
        <div className="rounded-[20px] border border-white/16 bg-gradient-to-b from-[#303033]/95 via-[#242426]/95 to-[#202022]/95 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_55px_rgba(0,0,0,0.32)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-[#F4F4F5]">Room settings</h2>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="grid size-9 cursor-pointer place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="grid gap-5">
            {isAdmin ? (
              <div className="grid gap-4">
                <form onSubmit={handleRenameRoom} className="grid gap-3">
                  <label className="grid gap-2 text-sm text-zinc-300">
                    Rename room
                    <Input name="name" defaultValue={activeRoom.name} placeholder="Room name" />
                  </label>
                  <Button
                    type="submit"
                    size="sm"
                    className="w-fit justify-self-end h-10 rounded-full border-2 border-white/10 bg-transparent px-5 text-sm font-semibold text-white shadow-none transition-all duration-300 hover:border-white/22 hover:bg-white/8 hover:text-white cursor-pointer"
                  >
                    Save name
                  </Button>
                </form>
              </div>
            ) : (
              <p className="rounded-lg border border-white/8 bg-white/4 p-3 text-sm text-zinc-400">
                {activeRoom.type === 'DM'
                  ? 'Direct messages do not use group admin settings.'
                  : 'Only the active room admin can rename or delete this room.'}
              </p>
            )}

            {roomActionError ? (
              <p className="rounded-lg border border-red-300/20 bg-red-950/20 p-3 text-sm text-red-200">
                {roomActionError}
              </p>
            ) : null}

            <div className="flex gap-2 justify-end mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLeaveRoom}
                className="h-10 rounded-full border-2 border-white/10 bg-transparent px-5 text-sm font-semibold text-white shadow-none transition-all duration-300 hover:border-white/22 hover:bg-white/8 hover:text-white cursor-pointer"
              >
                <LogOut size={14} aria-hidden="true" />
                Leave room
              </Button>
              {isAdmin ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSettingsOpen(false)
                    setIsDeleteConfirmOpen(true)
                  }}
                  className="h-10 rounded-full border-2 border-red-500/15 bg-transparent px-5 text-sm font-semibold text-red-400 shadow-none transition-all duration-300 hover:border-red-500/30 hover:bg-red-950/10 hover:text-red-300 cursor-pointer"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete room
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete room"
        size="lg"
        hideHeader
        className="relative overflow-visible rounded-[28px] border border-white/10 bg-black/50 p-5 shadow-[0_26px_80px_rgba(0,0,0,0.58)]"
      >
        <div className="rounded-[20px] border border-white/16 bg-gradient-to-b from-[#303033]/95 via-[#242426]/95 to-[#202022]/95 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_55px_rgba(0,0,0,0.32)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-[#F4F4F5]">Delete room</h2>
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="grid size-9 cursor-pointer place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="grid gap-5">
            <p className="text-sm leading-6 text-zinc-300 text-center">
              Are you sure you want to delete this room?
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsDeleteConfirmOpen(false)
                  setIsSettingsOpen(true)
                }}
                className="h-10 rounded-full border-2 border-white/10 bg-transparent px-5 text-sm font-semibold text-white shadow-none transition-all duration-300 hover:border-white/22 hover:bg-white/8 hover:text-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleDeleteRoom}
                className="h-10 rounded-full border-2 border-red-500/15 bg-transparent px-5 text-sm font-semibold text-red-400 shadow-none transition-all duration-300 hover:border-red-500/30 hover:bg-red-950/10 hover:text-red-300 cursor-pointer"
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete room
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </section>
  )
}
