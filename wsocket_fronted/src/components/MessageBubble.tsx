import type { ChatMessage } from '../types/chat'

type MessageBubbleProps = {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <article className="max-w-[min(36rem,88%)] rounded-lg border border-white/12 bg-white/95 px-4 py-3 text-zinc-950 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-teal-700">
        <span className="grid size-5 place-items-center rounded-full bg-teal-100 uppercase ring-1 ring-teal-300/50">
          {message.senderId?.slice(0, 1) ?? '?'}
        </span>
        <span>{message.senderId?.slice(0, 8) ?? 'unknown'}</span>
      </div>
      <p className="break-words text-sm leading-6">{message.mess}</p>
    </article>
  )
}
