import { apiClient } from './apiClient'
import type { ChatRoom } from '../types/chat'

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const normalizeRoom = (room: ChatRoom): ChatRoom => ({
  ...room,
  description: room.description || 'Realtime room',
  type: room.type ?? 'GROUP',
})

export const roomService = {
  list: async () => {
    const response = await apiClient.get<{ rooms: ChatRoom[] }>('/rooms')
    return response.data.rooms.map(normalizeRoom)
  },
  create: async (name: string, slug?: string) => {
    const response = await apiClient.post<{ room: ChatRoom }>('/rooms', {
      name: name.trim(),
      slug: slug ? createSlug(slug) : undefined,
    })

    return normalizeRoom(response.data.room)
  },
  update: async (roomId: string, name: string) => {
    const response = await apiClient.patch<{ room: ChatRoom }>(`/rooms/${roomId}`, {
      name: name.trim(),
    })

    return normalizeRoom(response.data.room)
  },
  delete: async (roomId: string) => {
    await apiClient.delete(`/rooms/${roomId}`)
  },
  get: async (roomId: string) => {
    const response = await apiClient.get<{ room: ChatRoom }>(`/rooms/${roomId}`)
    return normalizeRoom(response.data.room)
  },
  createSlug,
}
