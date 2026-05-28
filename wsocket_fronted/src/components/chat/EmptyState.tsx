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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-teal-200/20 bg-black/28 p-6 text-center backdrop-blur-md"
    >
      <div className="mx-auto mb-4 grid size-11 place-items-center rounded-lg bg-teal-300/12 text-teal-200">
        <Icon size={21} aria-hidden="true" />
      </div>
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">{description}</p>
    </motion.div>
  )
}
