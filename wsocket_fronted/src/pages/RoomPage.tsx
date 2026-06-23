import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'

import { ChatWorkspace } from '../components/chat/ChatWorkspace'
import { CompetingRoomWorkspace } from '../components/competing/CompetingRoomWorkspace'
import { WorkspaceSkeleton } from '../components/ui/WorkspaceSkeleton'
import { ChatWorkspaceSkeleton } from '../components/chat/ChatWorkspaceSkeleton'
import { roomService } from '../services/roomService'
import { useRooms } from '../hooks/useRooms'
import type { ChatRoom } from '../types/chat'

export function RoomPage() {
  const { roomId } = useParams()
  const location = useLocation()
  const { rooms } = useRooms()
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)

  
  const statePurpose = location.state?.purpose as 'COLLABORATIVE' | 'COMPETING' | undefined
  const cachedRoom = rooms.find((r) => r.id === roomId)
  const roomPurpose = statePurpose ?? cachedRoom?.purpose ?? room?.purpose

  useEffect(() => {
    if (!roomId) {
      setRoomError('Room id is missing')
      setIsLoadingRoom(false)
      return
    }

    let isCurrentRequest = true

    const loadRoom = async () => {
      setIsLoadingRoom(true)
      setRoomError(null)

      try {
        const loadedRoom = await roomService.get(roomId)

        if (isCurrentRequest) {
          setRoom(loadedRoom)
        }
      } catch {
        if (isCurrentRequest) {
          setRoom(null)
          setRoomError('Could not open this room')
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoadingRoom(false)
        }
      }
    }

    void loadRoom()

    return () => {
      isCurrentRequest = false
    }
  }, [roomId])

  if (isLoadingRoom) {
    if (roomPurpose === 'COMPETING') {
      return <WorkspaceSkeleton />
    }
    return <ChatWorkspaceSkeleton />
  }

  if (roomError || !room) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#05070A] px-4 text-center">
        <div className="rounded-2xl border border-red-300/20 bg-red-950/15 p-6 text-red-100 shadow-xl shadow-black/20">
          {roomError ?? 'Room not found'}
        </div>
      </div>
    )
  }

  if (room.purpose === 'COMPETING') {
    return <CompetingRoomWorkspace room={room} />
  }

  return <ChatWorkspace roomId={roomId} />
}
