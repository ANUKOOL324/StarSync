import { useCallback, useEffect, useRef, useState } from 'react'

import { messageService } from '../services/messageService'
import {
  createSocketIoChatSocket,
  type ChatSocket,
} from '../services/socketIoService'
import type { ChatMessage, OnlineUser, TypingUser, RoomTimerUpdateEvent, RoomSubmissionCreatedEvent } from '../types/chat'
import type { EditorLanguage, EditorPresenceUser, EditorSyncEvent } from '../types/editor'

const createClientMessageId = () => crypto.randomUUID()

export function useChatSocket(roomId: string, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'online' | 'offline'>(
    'connecting',
  )
  const [socketError, setSocketError] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [editorPresenceUsers, setEditorPresenceUsers] = useState<EditorPresenceUser[]>([])
  const [lastEditorSync, setLastEditorSync] = useState<EditorSyncEvent | null>(null)
  const [roomTimerEvent, setRoomTimerEvent] = useState<RoomTimerUpdateEvent['payload'] | null>(null)
  const [newSubmissionEvent, setNewSubmissionEvent] = useState<RoomSubmissionCreatedEvent['payload'] | null>(null)
  const socketRef = useRef<ChatSocket | null>(null)
  const typingTimersRef = useRef<Map<string, number>>(new Map())
  const lastTypingSentRef = useRef(0)
  const nextCursorRef = useRef<string | null>(null)

  const clearTypingUser = useCallback((typingUserId: string) => {
    const timer = typingTimersRef.current.get(typingUserId)

    if (timer) {
      window.clearTimeout(timer)
      typingTimersRef.current.delete(typingUserId)
    }

    setTypingUsers((currentUsers) => currentUsers.filter((user) => user.id !== typingUserId))
  }, [])

  useEffect(() => {
    if (!roomId || !userId) {
      setMessages([])
      setOnlineUsers([])
      setTypingUsers([])
      setEditorPresenceUsers([])
      setLastEditorSync(null)
      setConnectionStatus('offline')
      setSocketError(null)
      return
    }

    let isActive = true
    const socket = createSocketIoChatSocket()
    const typingTimers = typingTimersRef.current
    socketRef.current = socket
    queueMicrotask(() => {
      setConnectionStatus('connecting')
      setMessages([])
      setOnlineUsers([])
      setTypingUsers([])
      setEditorPresenceUsers([])
      setLastEditorSync(null)
      setSocketError(null)
      setHasMoreMessages(false)
      nextCursorRef.current = null
    })

    const loadHistory = async () => {
      setIsLoadingHistory(true)

      try {
        const history = await messageService.history(roomId)

        if (isActive) {
          nextCursorRef.current = history.nextCursor
          setHasMoreMessages(Boolean(history.nextCursor))
          setMessages(
            history.messages.map((message) => ({
              ...message,
              status: 'sent',
              isOwn: message.senderId === userId,
            })),
          )
        }
      } catch {
        if (isActive) {
          setSocketError('You do not have access to this room')
        }
      } finally {
        if (isActive) {
          setIsLoadingHistory(false)
        }
      }
    }

    void loadHistory()

    socket.on('connect', () => {
      socket.emit('join', { roomId })
    })

    socket.on('presence', (payload) => {
      if (payload.roomId !== roomId) return

      setConnectionStatus('online')
      setOnlineUsers(payload.users)
    })

    socket.on('typing:update', ({ roomId: eventRoomId, userId: typingUserId, username, isTyping }) => {
      if (eventRoomId !== roomId) return
      if (typingUserId === userId) return

      if (isTyping) {
        setTypingUsers((currentUsers) => {
          if (currentUsers.some((user) => user.id === typingUserId)) return currentUsers
          return [...currentUsers, { id: typingUserId, username }]
        })

        const existingTimer = typingTimers.get(typingUserId)
        if (existingTimer) window.clearTimeout(existingTimer)
        typingTimers.set(
          typingUserId,
          window.setTimeout(() => clearTypingUser(typingUserId), 4000),
        )
      } else {
        clearTypingUser(typingUserId)
      }
    })

    socket.on('editor:sync', (payload) => {
      if (payload.roomId !== roomId) return

      setLastEditorSync(payload)
    })

    socket.on('editor:presence:update', (payload) => {
      if (payload.roomId !== roomId) return

      setEditorPresenceUsers(payload.users)
    })

    socket.on('message-error', ({ clientMessageId }) => {
      if (clientMessageId) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.clientMessageId === clientMessageId
              ? { ...message, status: 'failed' }
              : message,
          ),
        )
      }
    })

    socket.on('ROOM_TIMER_UPDATED', (payload) => {
      if (payload.roomId !== roomId) return

      setRoomTimerEvent(payload)
    })

    socket.on('ROOM_SUBMISSION_CREATED', (payload) => {
      if (payload.roomId !== roomId) return

      setNewSubmissionEvent(payload)
    })

    socket.on('error', (payload) => {
      setSocketError(payload.message)
    })

    socket.on('message', (message) => {
      setMessages((currentMessages) => {
        const existingIndex = currentMessages.findIndex(
          (item) =>
            (message.clientMessageId && item.clientMessageId === message.clientMessageId) ||
            (message.id && item.id === message.id),
        )

        const nextMessage: ChatMessage = {
          ...message,
          mess: message.mess ?? message.content ?? '',
          status: 'sent',
          isOwn: message.senderId === userId,
        }

        if (existingIndex === -1) {
          return [...currentMessages, nextMessage]
        }

        return currentMessages.map((item, index) => (index === existingIndex ? nextMessage : item))
      })
    })

    socket.on('connect_error', () => {
      setConnectionStatus('offline')
      setTypingUsers([])
      setEditorPresenceUsers([])
    })

    socket.on('disconnect', () => {
      setConnectionStatus('offline')
      setTypingUsers([])
      setEditorPresenceUsers([])
    })

    socket.connect()

    return () => {
      isActive = false
      typingTimers.forEach((timer) => window.clearTimeout(timer))
      typingTimers.clear()
      socket.removeAllListeners()
      socket.disconnect()

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [clearTypingUser, roomId, userId])

  const loadOlderMessages = useCallback(async () => {
    const cursor = nextCursorRef.current

    if (!roomId || !cursor || isLoadingOlder) return

    setIsLoadingOlder(true)

    try {
      const history = await messageService.history(roomId, cursor)
      nextCursorRef.current = history.nextCursor
      setHasMoreMessages(Boolean(history.nextCursor))
      setMessages((currentMessages) => [
        ...history.messages.map((message) => ({
          ...message,
          status: 'sent' as const,
          isOwn: message.senderId === userId,
        })),
        ...currentMessages,
      ])
    } finally {
      setIsLoadingOlder(false)
    }
  }, [isLoadingOlder, roomId, userId])

  const sendTyping = useCallback(() => {
    const now = Date.now()

    if (now - lastTypingSentRef.current < 1200) return
    if (!socketRef.current?.connected) return

    lastTypingSentRef.current = now
    socketRef.current.emit('typing:start', { roomId })
  }, [roomId])

  const sendStopTyping = useCallback(() => {
    if (!socketRef.current?.connected) return

    lastTypingSentRef.current = 0
    socketRef.current.emit('typing:stop', { roomId })
  }, [roomId])

  const sendMessage = (message: string, existingClientMessageId?: string) => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) return

    const clientMessageId = existingClientMessageId ?? createClientMessageId()

    if (!socketRef.current?.connected) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          clientMessageId,
          mess: trimmedMessage,
          senderId: userId ?? '',
          createdAt: new Date().toISOString(),
          isOwn: true,
          status: 'failed',
        },
      ])
      return
    }

    setMessages((currentMessages) => {
      const existingMessage = currentMessages.find(
        (item) => item.clientMessageId === clientMessageId,
      )

      if (existingMessage) {
        return currentMessages.map((item) =>
          item.clientMessageId === clientMessageId ? { ...item, status: 'sending' } : item,
        )
      }

      return [
        ...currentMessages,
        {
          clientMessageId,
          mess: trimmedMessage,
          senderId: userId ?? '',
          createdAt: new Date().toISOString(),
          isOwn: true,
          status: 'sending',
        },
      ]
    })

    sendStopTyping()
    socketRef.current.emit('chat', {
      message: trimmedMessage,
      clientMessageId,
    })
  }

  const retryMessage = (message: ChatMessage) => {
    sendMessage(message.mess, message.clientMessageId)
  }

  const sendEditorChange = useCallback(
    (content: string, language: EditorLanguage) => {
      if (!socketRef.current?.connected) return

      socketRef.current.emit('editor:change', {
        roomId,
        content,
        language,
      })
    },
    [roomId],
  )

  const sendEditorPresence = useCallback(
    (status: 'active' | 'inactive') => {
      if (!socketRef.current?.connected) return

      socketRef.current.emit('editor:presence', {
        roomId,
        status,
      })
    },
    [roomId],
  )

  return {
    connectionStatus,
    editorPresenceUsers,
    hasMoreMessages,
    isLoadingHistory,
    isLoadingOlder,
    loadOlderMessages,
    lastEditorSync,
    messages,
    newSubmissionEvent,
    onlineUsers,
    retryMessage,
    roomTimerEvent,
    sendEditorChange,
    sendEditorPresence,
    sendMessage,
    sendStopTyping,
    sendTyping,
    socketError,
    typingUsers,
  }
}
