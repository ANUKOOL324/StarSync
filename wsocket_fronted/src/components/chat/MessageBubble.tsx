import { motion } from 'framer-motion'

import type { ChatMessage } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

type MessageBubbleProps = {
  message: ChatMessage
}

const formatTime = (value?: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value ? new Date(value) : new Date())

export function MessageBubble({ message }: MessageBubbleProps) {
  const name = message.isOwn ? 'You' : message.senderId?.slice(0, 8) ?? 'Guest'

  return (
    <motion.article
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={['flex gap-2.5', message.isOwn ? 'justify-end' : 'justify-start'].join(' ')}
    >
      {!message.isOwn ? <Avatar name={name} tone="dark" /> : null}
      <div
        className={[
          'max-w-[min(34rem,82%)] rounded-2xl border px-3.5 py-2.5 shadow-2xl backdrop-blur',
          message.isOwn
            ? 'rounded-br-md border-teal-200/30 bg-teal-300 text-zinc-950 shadow-teal-500/10'
            : 'rounded-bl-md border-white/8 bg-black/42 text-zinc-100 shadow-black/20',
        ].join(' ')}
      >
        <div
          className={[
            'mb-1 flex items-center gap-2 text-xs font-semibold',
            message.isOwn ? 'text-teal-950/70' : 'text-teal-200',
          ].join(' ')}
        >
          <span>{name}</span>
          <span className={message.isOwn ? 'text-zinc-800/60' : 'text-zinc-500'}>
            {formatTime(message.createdAt)}
          </span>
        </div>
        <p className="break-words text-sm leading-5">{message.mess}</p>
      </div>
    </motion.article>
  )
}
