import { apiClient } from './apiClient'
import type { ChatRoom } from '../types/chat'

const normalizeDmRoom = (room: ChatRoom): ChatRoom => ({
  ...room,
  type: 'DM',
  description: room.otherUser ? `Direct message with ${room.otherUser.username}` : 'Direct message',
})

export const dmService = {
  list: async () => {
    const response = await apiClient.get<{ rooms: ChatRoom[] }>('/dms')
    return response.data.rooms.map(normalizeDmRoom)
  },
  create: async ({ sourceRoomId, userId }: { sourceRoomId?: string; userId: string }) => {
    const response = await apiClient.post<{ room: ChatRoom }>('/dms', {
      sourceRoomId,
      userId,
    })

    return normalizeDmRoom(response.data.room)
  },
}
