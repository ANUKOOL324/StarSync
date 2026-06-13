import { useCallback, useEffect, useRef, useState } from 'react'

import { messageService } from '../services/messageService'
import { createChatSocket } from '../services/websocketService'
import type { ChatMessage, OnlineUser, TypingUser } from '../types/chat'
import type { EditorLanguage, EditorPresenceUser, EditorSyncEvent } from '../types/editor'
import { tokenStorage } from '../utils/tokenStorage'

type ServerEvent =
  | {
      type: 'message'
      payload: ChatMessage
    }
  | {
      type: 'message-error'
      payload: {
        clientMessageId?: string
        message: string
      }
    }
  | {
      type: 'presence'
      payload: {
        onlineCount: number
        users: OnlineUser[]
      }
    }
  | {
      type: 'typing:update'
      payload: {
        roomId: string
        userId: string
        username: string
        isTyping: boolean
      }
    }
  | {
      type: 'editor:sync'
      payload: EditorSyncEvent
    }
  | {
      type: 'editor:presence:update'
      payload: {
        roomId: string
        users: EditorPresenceUser[]
      }
    }
  | {
      type: 'error'
      payload: {
        message: string
      }
    }

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
  const socketRef = useRef<WebSocket | null>(null)
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
    const token = tokenStorage.get()

    if (!roomId || !userId || !token) {
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
    const socket = createChatSocket(token)
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

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'join',
          payload: { roomId },
        }),
      )
    }

    socket.onmessage = (event) => {
      let serverEvent: ServerEvent | ChatMessage

      try {
        serverEvent = JSON.parse(event.data) as ServerEvent | ChatMessage
      } catch {
        return
      }

      if ('type' in serverEvent && serverEvent.type === 'presence') {
        setConnectionStatus('online')
        setOnlineUsers(serverEvent.payload.users)
        return
      }

      if ('type' in serverEvent && serverEvent.type === 'typing:update') {
        const { roomId: eventRoomId, userId: typingUserId, username, isTyping } = serverEvent.payload

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
        return
      }

      if ('type' in serverEvent && serverEvent.type === 'editor:sync') {
        if (serverEvent.payload.roomId !== roomId) return

        setLastEditorSync(serverEvent.payload)
        return
      }

      if ('type' in serverEvent && serverEvent.type === 'editor:presence:update') {
        if (serverEvent.payload.roomId !== roomId) return

        setEditorPresenceUsers(serverEvent.payload.users)
        return
      }

      if ('type' in serverEvent && serverEvent.type === 'message-error') {
        const { clientMessageId } = serverEvent.payload

        if (clientMessageId) {
          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.clientMessageId === clientMessageId
                ? { ...message, status: 'failed' }
                : message,
            ),
          )
        }
        return
      }

      if ('type' in serverEvent && serverEvent.type === 'error') {
        setSocketError(serverEvent.payload.message)
        return
      }

      const message: ChatMessage =
        'type' in serverEvent && serverEvent.type === 'message'
          ? serverEvent.payload
          : (serverEvent as ChatMessage)

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
    }

    socket.onclose = () => {
      setConnectionStatus('offline')
      setTypingUsers([])
      setEditorPresenceUsers([])
    }

    socket.onerror = () => {
      setConnectionStatus('offline')
      setTypingUsers([])
      setEditorPresenceUsers([])
    }

    return () => {
      isActive = false
      typingTimers.forEach((timer) => window.clearTimeout(timer))
      typingTimers.clear()
      socket.close()
      socketRef.current = null
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
    if (socketRef.current?.readyState !== WebSocket.OPEN) return

    lastTypingSentRef.current = now
    socketRef.current.send(
      JSON.stringify({
        type: 'typing:start',
        payload: { roomId },
      }),
    )
  }, [roomId])

  const sendStopTyping = useCallback(() => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return
    lastTypingSentRef.current = 0
    socketRef.current.send(
      JSON.stringify({
        type: 'typing:stop',
        payload: { roomId },
      }),
    )
  }, [roomId])

  const sendMessage = (message: string, existingClientMessageId?: string) => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) return

    const clientMessageId = existingClientMessageId ?? createClientMessageId()

    if (socketRef.current?.readyState !== WebSocket.OPEN) {
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
    socketRef.current.send(
      JSON.stringify({
        type: 'chat',
        payload: { message: trimmedMessage, clientMessageId },
      }),
    )
  }

  const retryMessage = (message: ChatMessage) => {
    sendMessage(message.mess, message.clientMessageId)
  }

  const sendEditorChange = useCallback(
    (content: string, language: EditorLanguage) => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) return

      socketRef.current.send(
        JSON.stringify({
          type: 'editor:change',
          payload: {
            roomId,
            content,
            language,
          },
        }),
      )
    },
    [roomId],
  )

  const sendEditorPresence = useCallback(
    (status: 'active' | 'inactive') => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) return

      socketRef.current.send(
        JSON.stringify({
          type: 'editor:presence',
          payload: {
            roomId,
            status,
          },
        }),
      )
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
    onlineUsers,
    retryMessage,
    sendEditorChange,
    sendEditorPresence,
    sendMessage,
    sendStopTyping,
    sendTyping,
    socketError,
    typingUsers,
  }
}


