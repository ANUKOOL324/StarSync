import { AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'

import type { ChatMessage } from '../../types/chat'
import { Loader } from '../ui/Loader'
import { EmptyState } from './EmptyState'
import { MessageBubble } from './MessageBubble'

type MessageListProps = {
  connectionStatus: 'connecting' | 'online' | 'offline'
  hasMoreMessages?: boolean
  isLoadingHistory?: boolean
  isLoadingOlder?: boolean
  messages: ChatMessage[]
  onLoadOlderMessages?: () => Promise<void> | void
  onRetryMessage: (message: ChatMessage) => void
  variant?: 'default' | 'sidebar'
}

export function MessageList({
  connectionStatus,
  hasMoreMessages,
  isLoadingHistory,
  isLoadingOlder,
  messages,
  onLoadOlderMessages,
  onRetryMessage,
  variant = 'default',
}: MessageListProps) {
  const isSidebar = variant === 'sidebar'
  const isEmpty = messages.length === 0 && connectionStatus !== 'connecting' && !isLoadingHistory
  const endRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const previousLengthRef = useRef(0)
  const isLoadingOlderRef = useRef(false)

  useEffect(() => {
    if (messages.length <= previousLengthRef.current) {
      previousLengthRef.current = messages.length
      return
    }

    const latestMessage = messages[messages.length - 1]

    if (!latestMessage?.isOwn) {
      const list = listRef.current
      const isNearBottom = list ? list.scrollHeight - list.scrollTop - list.clientHeight < 180 : true

      if (!isNearBottom) {
        previousLengthRef.current = messages.length
        return
      }
    }

    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    previousLengthRef.current = messages.length
  }, [messages])

  const handleScroll = async () => {
    const list = listRef.current

    if (!list || !hasMoreMessages || isLoadingOlder || isLoadingOlderRef.current) return
    if (list.scrollTop > 80) return

    isLoadingOlderRef.current = true
    const previousHeight = list.scrollHeight
    await onLoadOlderMessages?.()
    window.requestAnimationFrame(() => {
      list.scrollTop = list.scrollHeight - previousHeight + list.scrollTop
      isLoadingOlderRef.current = false
    })
  }

  const formatDate = (value?: string) =>
    new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(value ? new Date(value) : new Date())

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className={[
        'h-full overflow-y-auto overscroll-contain',
        isSidebar ? 'px-3 py-3' : 'px-4 py-4 sm:px-6 sm:py-5 lg:px-8',
        isEmpty ? 'flex flex-col justify-center' : '',
      ].join(' ')}
    >
      <div className={['flex w-full flex-col gap-2', isSidebar ? '' : 'mx-auto max-w-5xl'].join(' ')}>
        {isLoadingOlder ? (
          <div className="py-2 text-center text-xs text-zinc-500">Loading older messages...</div>
        ) : null}
        {connectionStatus === 'connecting' || isLoadingHistory ? <Loader /> : null}
        {messages.length === 0 && connectionStatus !== 'connecting' && !isLoadingHistory ? (
          <EmptyState
            title="No messages yet"
            description="Start the conversation."
            variant={isSidebar ? 'sidebar' : 'chat'}
          />
        ) : null}
        {connectionStatus === 'offline' && messages.length ? (
          <div className="rounded-lg border border-amber-300/20 bg-amber-950/20 px-3 py-2 text-center text-xs text-amber-100">
            Connection lost. Messages will retry when the socket reconnects.
          </div>
        ) : null}
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => {
            const previousMessage = messages[index - 1]
            const currentDate = formatDate(message.createdAt)
            const previousDate = previousMessage ? formatDate(previousMessage.createdAt) : null
            const showDate = currentDate !== previousDate
            const isGrouped =
              previousMessage?.senderId === message.senderId && currentDate === previousDate

            return (
              <div key={message.id ?? message.clientMessageId ?? `${message.createdAt}-${index}`} className="grid gap-2">
                {showDate ? (
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/8" />
                    <span className="rounded-full border border-white/8 bg-white/[0.045] backdrop-blur-xl px-3 py-1 text-xs text-zinc-500">
                      {currentDate}
                    </span>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>
                ) : null}
                <MessageBubble
                  message={message}
                  isGrouped={isGrouped}
                  onRetry={() => onRetryMessage(message)}
                />
              </div>
            )
          })}
        </AnimatePresence>
        <div className="h-1" ref={endRef} />
      </div>
    </div>
  )
}
