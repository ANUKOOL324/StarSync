import { io, type Socket } from 'socket.io-client'

import type {
  ChatMessage,
  OnlineUser,
  RoomSubmissionCreatedEvent,
  RoomTimerUpdateEvent,
} from '../types/chat'
import type { EditorLanguage, EditorPresenceUser, EditorSyncEvent } from '../types/editor'

const DEFAULT_LOCAL_SOCKET_IO_URL = 'http://localhost:3001'

const resolveSocketIoUrl = () => {
  const configuredUrl = import.meta.env.VITE_SOCKET_IO_URL?.trim()

  if (configuredUrl) {
    return configuredUrl
  }

  if (import.meta.env.DEV) {
    return DEFAULT_LOCAL_SOCKET_IO_URL
  }

  return window.location.origin
}

export interface ClientToServerEvents {
  join: (payload: { roomId: string }) => void
  chat: (payload: { message: string; clientMessageId?: string }) => void
  'typing:start': (payload: { roomId: string }) => void
  'typing:stop': (payload: { roomId: string }) => void
  'editor:change': (payload: {
    roomId: string
    content: string
    language: EditorLanguage
  }) => void
  'editor:presence': (payload: {
    roomId: string
    status: 'active' | 'inactive'
  }) => void
}

export interface ServerToClientEvents {
  presence: (payload: {
    roomId: string
    onlineCount: number
    users: OnlineUser[]
  }) => void
  message: (payload: ChatMessage) => void
  'message-error': (payload: { clientMessageId?: string; message: string }) => void
  'typing:update': (payload: {
    roomId: string
    userId: string
    username: string
    isTyping: boolean
  }) => void
  'editor:sync': (payload: EditorSyncEvent) => void
  'editor:presence:update': (payload: {
    roomId: string
    users: EditorPresenceUser[]
  }) => void
  error: (payload: { message: string }) => void
  ROOM_TIMER_UPDATED: (payload: RoomTimerUpdateEvent['payload']) => void
  ROOM_SUBMISSION_CREATED: (payload: RoomSubmissionCreatedEvent['payload']) => void
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const createSocketIoChatSocket = (): ChatSocket => {
  return io(resolveSocketIoUrl(), {
    path: '/socket.io',
    withCredentials: true,
    autoConnect: false,
  }) as ChatSocket
}
