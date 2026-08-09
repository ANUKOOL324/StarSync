import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { useChatSocket } from '../../hooks/useChatSocket'
import { useRooms } from '../../hooks/useRooms'
import { roomMemberService } from '../../services/roomMemberService'
import type { RoomMember } from '../../types/chat'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { MessageInput } from './MessageInput'
import { ChatWorkspaceSkeleton } from './ChatWorkspaceSkeleton'
import { MessageList } from './MessageList'
import { TypingIndicator } from './TypingIndicator'
import { OnlineUsersPanel } from './OnlineUsersPanel'
import { RoomHeader } from './RoomHeader'
import { RoomSidebar } from './RoomSidebar'
import { RoomSettingsDialogs } from './RoomSettingsDialogs'
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

  const [isDesktopLayout, setIsDesktopLayout] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia(`(min-width: ${DESKTOP_PANEL_BREAKPOINT}px)`).matches
  })
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
      const isDesktop = desktopQuery.matches
      setIsDesktopLayout(isDesktop)

      if (!isDesktop) {
        setIsSidebarOpen(false)
        setIsInfoOpen(false)
        return
      }

      setIsSidebarOpen(true)
      setIsInfoOpen(window.innerWidth >= COMFORTABLE_DETAILS_BREAKPOINT)
    }

    const handleDesktopBreakpointChange = (event: MediaQueryListEvent) => {
      setIsDesktopLayout(event.matches)

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
  const [openingDmUserId, setOpeningDmUserId] = useState<string | null>(null)
  const [dmActionError, setDmActionError] = useState<string | null>(null)
  const activeRoom = getRoom(roomId)
  const isDirectMessage = activeRoom?.type === 'DM'
  const isGroupRoom = activeRoom?.type === 'GROUP'
  const isAdmin = Boolean(user?.id && activeRoom?.adminId === user.id && !isDirectMessage)
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
    if (!activeRoom?.id || !isDirectMessage) {
      return
    }

    if (activeTab !== 'chat') {
      setActiveTab('chat')
    }
  }, [activeRoom?.id, activeTab, isDirectMessage])

  useEffect(() => {
    if (!activeRoom?.id || connectionStatus !== 'online' || isDirectMessage) {
      return
    }

    const nextEditorStatus = activeTab === 'editor' ? 'active' : 'inactive'
    sendEditorPresence(nextEditorStatus)

    return () => {
      if (activeTab === 'editor') {
        sendEditorPresence('inactive')
      }
    }
  }, [activeRoom?.id, activeTab, connectionStatus, isDirectMessage, sendEditorPresence])

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

  const handleOpenDirectMessage = async (memberId: string) => {
    if (!isGroupRoom || !activeRoom?.id || openingDmUserId) {
      return
    }

    setDmActionError(null)
    setOpeningDmUserId(memberId)

    try {
      const dmRoom = await createDm(memberId, activeRoom.id)
      navigate(`/rooms/${dmRoom.id}`)
    } catch {
      setDmActionError('Could not open that conversation. Try again.')
    } finally {
      setOpeningDmUserId(null)
    }
  }

  const sidebarProps = {
    activeRoom,
    activeRoomId: activeRoom.id,
    activeTab,
    dmRooms,
    isOpen: isSidebarOpen,
    onClose: () => setIsSidebarOpen(false),
    onlineUsers,
    onLogout: logout,
    onSelectRoom: (nextRoomId: string) => navigate(`/rooms/${nextRoomId}`),
    onTabChange: setActiveTab,
    rooms: rooms.filter((room) => room.purpose === 'COLLABORATIVE'),
    user,
  }

  const detailsPanelProps = {
    currentUserId: user?.id,
    dmActionError,
    isCurrentUserAdmin: isAdmin,
    isOpen: isInfoOpen,
    isLoadingMembers,
    membersError,
    onClose: () => setIsInfoOpen(false),
    onOpenDirectMessage: isGroupRoom ? handleOpenDirectMessage : undefined,
    onlineUsers,
    openingDmUserId,
    room: activeRoom,
    roomMembers,
  }

  return (
    <section
      ref={workspaceRef}
      className="relative flex h-dvh max-h-dvh w-full overflow-hidden"
    >
      {!isDesktopLayout && isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px]"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      ) : null}

      {!isDesktopLayout && isInfoOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px]"
          onClick={() => setIsInfoOpen(false)}
          aria-label="Close details overlay"
        />
      ) : null}

      {!isDesktopLayout ? <RoomSidebar {...sidebarProps} /> : null}
      {!isDesktopLayout ? <OnlineUsersPanel {...detailsPanelProps} /> : null}

      <ResizablePanelGroup
        direction="horizontal"
        id="starsync-room-layout"
        className="relative z-0 min-h-0 min-w-0 flex-1"
      >
        {isDesktopLayout && isSidebarOpen ? (
          <>
            <ResizablePanel
              id="room-sidebar"
              defaultSize="22%"
              minSize="18%"
              maxSize="30%"
            >
              <RoomSidebar {...sidebarProps} />
            </ResizablePanel>
            <ResizableHandle className="border-r border-white/10" withHandle />
          </>
        ) : isDesktopLayout ? (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="group relative flex w-2 shrink-0 items-stretch justify-center border-r border-[#18D6A3]/20 bg-[#05080A] transition hover:bg-[#18D6A3]/8"
            aria-label="Open room sidebar"
          >
            <span className="my-5 block w-px rounded-full bg-white/10 transition group-hover:w-1 group-hover:bg-[#18D6A3]/70" />
          </button>
        ) : null}

        <ResizablePanel
          id="room-workspace"
          defaultSize={isDesktopLayout ? (isInfoOpen ? '54%' : '78%') : '100%'}
          minSize={isDesktopLayout ? '44%' : '100%'}
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
                if (isDirectMessage) return
                setRoomActionError(null)
                setIsSettingsOpen(true)
              }}
              showSettings={!isDirectMessage}
              onOpenSidebar={() => {
                setIsInfoOpen(false)
                setIsSidebarOpen(true)
              }}
              onToggleInfo={() => {
                if (!isDesktopLayout) {
                  setIsSidebarOpen(false)
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

            {activeTab === 'editor' && !isDirectMessage && (
              <Suspense fallback={<EditorSkeleton />}>
                <LazyCodeEditorWorkspace
                  connectionStatus={connectionStatus}
                  activeCollaborators={editorPresenceUsers}
                  room={activeRoom}
                />
              </Suspense>
            )}

            {activeTab === 'whiteboard' && !isDirectMessage && (
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

        {isDesktopLayout && isInfoOpen ? (
          <>
            <ResizableHandle className="border-l border-white/10" withHandle />
            <ResizablePanel
              id="room-details"
              defaultSize="24%"
              minSize="18%"
              maxSize="32%"
            >
              <OnlineUsersPanel {...detailsPanelProps} />
            </ResizablePanel>
          </>
        ) : isDesktopLayout ? (
          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            className="group relative flex w-2 shrink-0 items-stretch justify-center border-l border-[#18D6A3]/20 bg-[#05080A] transition hover:bg-[#18D6A3]/8"
            aria-label="Open room details"
          >
            <span className="my-5 block w-px rounded-full bg-white/10 transition group-hover:w-1 group-hover:bg-[#18D6A3]/70" />
          </button>
        ) : null}
      </ResizablePanelGroup>



      {!isDirectMessage ? (
        <RoomSettingsDialogs
          isAdmin={isAdmin}
          isDeleteConfirmOpen={isDeleteConfirmOpen}
          isSettingsOpen={isSettingsOpen}
          onCancelDelete={() => {
            setIsDeleteConfirmOpen(false)
            setIsSettingsOpen(true)
          }}
          onCloseDelete={() => setIsDeleteConfirmOpen(false)}
          onCloseSettings={() => setIsSettingsOpen(false)}
          onDelete={handleDeleteRoom}
          onLeave={handleLeaveRoom}
          onOpenDelete={() => {
            setIsSettingsOpen(false)
            setIsDeleteConfirmOpen(true)
          }}
          onRename={handleRenameRoom}
          room={activeRoom}
          roomActionError={roomActionError}
        />
      ) : null}
    </section>
  )
}
