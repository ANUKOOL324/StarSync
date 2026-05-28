import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { useChatSocket } from '../../hooks/useChatSocket'
import { useRooms } from '../../hooks/useRooms'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { OnlineUsersPanel } from './OnlineUsersPanel'
import { RoomHeader } from './RoomHeader'
import { RoomSidebar } from './RoomSidebar'

type ChatWorkspaceProps = {
  roomId: string | undefined
}

const onlineUsers = [
  { id: '1', name: 'Anukool', status: 'online' as const },
  { id: '2', name: 'Team Member', status: 'online' as const },
  { id: '3', name: 'Design', status: 'idle' as const },
]

export function ChatWorkspace({ roomId }: ChatWorkspaceProps) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { createRoom, getRoom, rooms } = useRooms()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const activeRoom = getRoom(roomId)
  const { connectionStatus, messages, sendMessage } = useChatSocket(activeRoom?.slug ?? '')

  if (!activeRoom) {
    return <Navigate to="/dashboard" replace />
  }

  const handleCreateRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '')
    const room = createRoom(name)

    if (room) {
      setIsCreateModalOpen(false)
      navigate(`/rooms/${room.id}`)
    }
  }

  return (
    <section className="relative h-dvh overflow-hidden lg:flex">
      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <RoomSidebar
        activeRoomId={activeRoom.id}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onCreateRoom={() => setIsCreateModalOpen(true)}
        onLogout={logout}
        onSelectRoom={(nextRoomId) => navigate(`/rooms/${nextRoomId}`)}
        rooms={rooms}
        user={user}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <RoomHeader
          connectionStatus={connectionStatus}
          room={activeRoom}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onToggleInfo={() => setIsInfoOpen((current) => !current)}
        />
        <MessageList connectionStatus={connectionStatus} messages={messages} />
        <div className="px-4 pb-2 text-xs text-zinc-500 sm:px-6">
          {connectionStatus === 'online' ? 'Connected' : 'Reconnecting'} · typing indicators coming soon
        </div>
        <MessageInput
          disabled={connectionStatus !== 'online'}
          roomName={activeRoom.name}
          onSend={sendMessage}
        />
      </div>

      <OnlineUsersPanel isOpen={isInfoOpen} onlineUsers={onlineUsers} room={activeRoom} />

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
    </section>
  )
}
