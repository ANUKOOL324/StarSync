import { useEffect, useRef, useState } from 'react'

import { createChatSocket } from '../services/websocketService'
import type { ChatMessage } from '../types/chat'

export function useChatSocket(roomId = 'red') {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'online' | 'offline'>(
    'connecting',
  )
  const socketRef = useRef<WebSocket | null>(null)
  const pendingMessagesRef = useRef<string[]>([])

  useEffect(() => {
    const socket = createChatSocket()
    socketRef.current = socket
    queueMicrotask(() => {
      setConnectionStatus('connecting')
      setMessages([])
    })
    pendingMessagesRef.current = []

    socket.onopen = () => {
      setConnectionStatus('online')
      socket.send(
        JSON.stringify({
          type: 'join',
          payload: { roomId },
        }),
      )
    }

    socket.onmessage = (event) => {
      const parsedMessage = JSON.parse(event.data) as ChatMessage
      const pendingIndex = pendingMessagesRef.current.findIndex((message) => message === parsedMessage.mess)

      if (pendingIndex !== -1) {
        pendingMessagesRef.current.splice(pendingIndex, 1)
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          ...parsedMessage,
          createdAt: new Date().toISOString(),
          isOwn: pendingIndex !== -1,
        },
      ])
    }

    socket.onclose = () => {
      setConnectionStatus('offline')
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [roomId])

  const sendMessage = (message: string) => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage || socketRef.current?.readyState !== WebSocket.OPEN) {
      return
    }

    pendingMessagesRef.current.push(trimmedMessage)
    socketRef.current.send(
      JSON.stringify({
        type: 'chat',
        payload: { message: trimmedMessage },
      }),
    )
  }

  return { connectionStatus, messages, sendMessage }
}
