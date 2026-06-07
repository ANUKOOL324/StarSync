import { motion, AnimatePresence } from 'framer-motion'

export type TypingUser = {
  id: string
  username: string
}

type TypingIndicatorProps = {
  typingUsers: TypingUser[]
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const formatTypingText = (users: TypingUser[]) => {
    if (users.length === 1) return `${users[0].username} is typing...`
    if (users.length === 2) return `${users[0].username} and ${users[1].username} are typing...`
    const othersCount = users.length - 2
    const otherText = othersCount === 1 ? 'other' : 'others'
    return `${users[0].username}, ${users[1].username} and ${othersCount} ${otherText} are typing...`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="mx-auto flex w-full max-w-5xl shrink-0 items-center gap-2 px-4 py-1 text-xs text-slate-400 select-none sm:px-7"
      >
        {/* Modular inline styles for custom Discord-style typing dot animations */}
        <style>{`
          @keyframes typingDotBounce {
            0%, 100% {
              transform: translateY(0);
              opacity: 0.4;
            }
            50% {
              transform: translateY(-3px);
              opacity: 1;
            }
          }
          .typing-dots-container {
            display: flex;
            align-items: center;
            gap: 3px;
            height: 12px;
          }
          .typing-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background-color: currentColor;
            animation: typingDotBounce 1.2s infinite ease-in-out;
          }
          .typing-dot:nth-child(1) {
            animation-delay: 0s;
          }
          .typing-dot:nth-child(2) {
            animation-delay: 0.15s;
          }
          .typing-dot:nth-child(3) {
            animation-delay: 0.3s;
          }
        `}</style>

        <div className="typing-dots-container" aria-hidden="true">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
        <span className="font-medium tracking-wide">{formatTypingText(typingUsers)}</span>
      </motion.div>
    </AnimatePresence>
  )
}
