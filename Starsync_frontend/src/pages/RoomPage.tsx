import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'

import { ChatWorkspace } from '../components/chat/ChatWorkspace'
import { CompetingRoomWorkspace } from '../components/competing/CompetingRoomWorkspace'
import { WorkspaceSkeleton } from '../components/ui/WorkspaceSkeleton'
import { ChatWorkspaceSkeleton } from '../components/chat/ChatWorkspaceSkeleton'
import { roomService } from '../services/roomService'
import { useRooms } from '../hooks/useRooms'
import type { ChatRoom } from '../types/chat'

type RoomPurpose = 'COLLABORATIVE' | 'COMPETING'

const roomPurposeStorageKey = (roomId: string) => `room-purpose:${roomId}`

const readStoredRoomPurpose = (roomId: string | undefined): RoomPurpose | undefined => {
  if (!roomId) return undefined

  try {
    const stored = sessionStorage.getItem(roomPurposeStorageKey(roomId))
    if (stored === 'COLLABORATIVE' || stored === 'COMPETING') {
      return stored
    }
  } catch {
    return undefined
  }

  return undefined
}

const writeStoredRoomPurpose = (roomId: string, purpose: RoomPurpose) => {
  try {
    sessionStorage.setItem(roomPurposeStorageKey(roomId), purpose)
  } catch {
    return
  }
}

export function RoomPage() {
  const { roomId } = useParams()
  const location = useLocation()
  const { rooms } = useRooms()
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)

  const statePurpose = location.state?.purpose as RoomPurpose | undefined
  const cachedRoom = rooms.find((r) => r.id === roomId)
  const roomPurpose = statePurpose ?? cachedRoom?.purpose ?? room?.purpose ?? readStoredRoomPurpose(roomId)

  useEffect(() => {
    if (statePurpose && roomId) {
      writeStoredRoomPurpose(roomId, statePurpose)
    }
  }, [statePurpose, roomId])

  useEffect(() => {
    const purpose = room?.purpose ?? cachedRoom?.purpose
    if (purpose && roomId) {
      writeStoredRoomPurpose(roomId, purpose)
    }
  }, [cachedRoom?.purpose, room?.purpose, roomId])

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
    if (roomPurpose === 'COLLABORATIVE') {
      return <ChatWorkspaceSkeleton />
    }

    if (roomPurpose === 'COMPETING') {
      return <WorkspaceSkeleton />
    }

    return null
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
