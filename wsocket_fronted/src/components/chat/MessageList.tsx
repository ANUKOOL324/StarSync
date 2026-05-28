import { AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'

import type { ChatMessage } from '../../types/chat'
import { Loader } from '../ui/Loader'
import { EmptyState } from './EmptyState'
import { MessageBubble } from './MessageBubble'

type MessageListProps = {
  connectionStatus: 'connecting' | 'online' | 'offline'
  messages: ChatMessage[]
}

export function MessageList({ connectionStatus, messages }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {connectionStatus === 'connecting' ? <Loader /> : null}
        {messages.length === 0 && connectionStatus !== 'connecting' ? (
          <EmptyState
            title="No messages yet"
            description="Start the room with a focused message. Everyone connected to this room receives it instantly."
          />
        ) : null}
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageBubble key={`${message.createdAt}-${index}`} message={message} />
          ))}
        </AnimatePresence>
        <div className="h-1" ref={endRef} />
      </div>
    </div>
  )
}
