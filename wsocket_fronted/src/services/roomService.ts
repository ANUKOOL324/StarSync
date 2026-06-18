import axios from 'axios'

import { apiClient } from './apiClient'
import type { ChatRoom } from '../types/chat'

export type CreateRoomPayload = {
  name: string
  maxMembers?: number | null
  unlimitedMembers?: boolean
  purpose?: 'COLLABORATIVE' | 'COMPETING'
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  topics?: string[]
  durationMinutes?: number
}

export type UpdateRoomPayload = {
  name?: string
  maxMembers?: number | null
  unlimitedMembers?: boolean
}

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
  purpose: room.purpose ?? 'COLLABORATIVE',
  difficulty: room.difficulty ?? null,
  topics: room.topics ?? [],
  durationMinutes: room.durationMinutes ?? null,
})

export const getRoomJoinErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError<{ message?: string }>(error)) {
    return 'Could not join room. Please try again.'
  }

  const statusCode = error.response?.status
  const serverMessage = error.response?.data?.message

  if (serverMessage) {
    return serverMessage
  }

  if (statusCode === 404) return 'Invalid room code.'
  if (statusCode === 409) return 'This room is full.'
  if (statusCode === 403) return 'You were removed from this room and cannot rejoin.'

  return 'Could not join room. Please try again.'
}

export const roomService = {
  list: async () => {
    const response = await apiClient.get<{ rooms: ChatRoom[] }>('/rooms')
    return response.data.rooms.map(normalizeRoom)
  },
  create: async (payload: CreateRoomPayload) => {
    const response = await apiClient.post<{ room: ChatRoom }>('/rooms', {
      name: payload.name.trim(),
      maxMembers: payload.unlimitedMembers ? null : payload.maxMembers,
      unlimitedMembers: payload.unlimitedMembers,
      purpose: payload.purpose,
      difficulty: payload.difficulty,
      topics: payload.topics,
      durationMinutes: payload.durationMinutes,
    })

    return normalizeRoom(response.data.room)
  },
  join: async (joinCode: string) => {
    const response = await apiClient.post<{ room: ChatRoom }>('/rooms/join', {
      joinCode: joinCode.trim(),
    })

    return normalizeRoom(response.data.room)
  },
  update: async (roomId: string, payload: UpdateRoomPayload) => {
    const response = await apiClient.patch<{ room: ChatRoom }>(`/rooms/${roomId}`, {
      ...payload,
      name: payload.name?.trim(),
      maxMembers: payload.unlimitedMembers ? null : payload.maxMembers,
    })

    return normalizeRoom(response.data.room)
  },
  updateCapacity: async (roomId: string, maxMembers: number | null) => {
    const response = await apiClient.patch<{ room: ChatRoom }>(`/rooms/${roomId}`, {
      maxMembers,
      unlimitedMembers: maxMembers === null,
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
