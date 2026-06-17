import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { ChatWorkspace } from '../components/chat/ChatWorkspace'
import { CompetingRoomWorkspace } from '../components/competing/CompetingRoomWorkspace'
import { Loader } from '../components/ui/Loader'
import { roomService } from '../services/roomService'
import type { ChatRoom } from '../types/chat'

export function RoomPage() {
  const { roomId } = useParams()
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)

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

  return <ChatWorkspace roomId={roomId} />
}
