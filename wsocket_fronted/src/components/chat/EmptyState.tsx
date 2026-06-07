import { motion } from 'framer-motion'
import { Hash, MessageCircle } from 'lucide-react'

type EmptyStateProps = {
  description: string
  title: string
  variant?: 'dashboard' | 'chat'
}

export function EmptyState({ description, title, variant = 'chat' }: EmptyStateProps) {
  const Icon = variant === 'dashboard' ? MessageCircle : Hash

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xs rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl"
    >
      <div className="mx-auto mb-3 grid size-9 place-items-center rounded-full border border-[#18D6A3]/20 bg-[#18D6A3]/12 text-[#7FFFE0] shadow-lg shadow-[#18D6A3]/10">
        <Icon size={18} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mx-auto mt-1.5 max-w-52 text-sm leading-5 text-zinc-500">{description}</p>
    </motion.div>
  )
}
