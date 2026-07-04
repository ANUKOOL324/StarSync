import { AlertCircle, CheckCheck, Clock3, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'

import type { ChatMessage } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

type MessageBubbleProps = {
  isGrouped?: boolean
  message: ChatMessage
  onRetry?: () => void
}

const formatTime = (value?: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value ? new Date(value) : new Date())

export function MessageBubble({ isGrouped, message, onRetry }: MessageBubbleProps) {
  const displayName = message.isOwn ? 'You' : message.sender?.username ?? message.senderId?.slice(0, 8) ?? 'Guest'
  const avatarSeed = message.sender?.username ?? message.sender?.email ?? message.senderId ?? displayName

  return (
    <motion.article
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.16 }}
      className={[
        'flex gap-3',
        message.isOwn ? 'justify-end' : 'justify-start',
        isGrouped ? 'mt-0.5' : 'mt-3',
      ].join(' ')}
    >
      {!message.isOwn ? (
        isGrouped ? (
          <div className="size-10 shrink-0" />
        ) : (
          <Avatar name={displayName} seed={avatarSeed} size="md" />
        )
      ) : null}
      <div
        className={[
          'max-w-[68%] rounded-2xl border px-4 py-2.5 shadow-lg backdrop-blur-md max-sm:max-w-[86%]',
          message.isOwn
            ? 'rounded-br-md border-[#18D6A3]/25 bg-[#18D6A3]/14 text-zinc-50 shadow-black/20'
            : 'rounded-bl-md border-white/8 bg-[#18181B]/82 text-zinc-100 shadow-black/20',
        ].join(' ')}
      >
        {!isGrouped ? (
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold">
            <span className={message.isOwn ? 'text-[#C8CEFF]' : 'text-zinc-200'}>{displayName}</span>
            <span className="text-zinc-500">{formatTime(message.createdAt)}</span>
          </div>
        ) : null}
        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-zinc-100">{message.mess}</p>
        {message.isOwn && message.status ? (
          <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[11px] font-medium">
            {message.status === 'sending' ? (
              <Clock3 size={12} className="text-zinc-400" aria-hidden="true" />
            ) : null}
            {message.status === 'sent' ? (
              <CheckCheck size={13} className="text-[#18D6A3]" aria-hidden="true" />
            ) : null}
            {message.status === 'failed' ? (
              <AlertCircle size={13} className="text-[#EF4444]" aria-hidden="true" />
            ) : null}
            <span
              className={[
                message.status === 'sent' ? 'text-zinc-500' : '',
                message.status === 'sending' ? 'text-zinc-400' : '',
                message.status === 'failed' ? 'text-[#EF4444]' : '',
              ].join(' ')}
            >
              {message.status}
            </span>
            {message.status === 'failed' ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 text-[#EF4444] underline"
              >
                <RotateCcw size={11} aria-hidden="true" />
                retry
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.article>
  )
}
