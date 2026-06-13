import { apiClient } from './apiClient'
import type { RoomMember } from '../types/chat'

export const roomMemberService = {
  list: async (roomId: string) => {
    const response = await apiClient.get<{ members: RoomMember[] }>(`/rooms/${roomId}/members`)

    return response.data.members
  },

  remove: async (roomId: string, userId: string) => {
    await apiClient.delete(`/rooms/${roomId}/members/${userId}`)
  },
}
