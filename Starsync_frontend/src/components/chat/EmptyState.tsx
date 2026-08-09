import { motion } from 'framer-motion'
import { Hash, MessageCircle } from 'lucide-react'

type EmptyStateProps = {
  description: string
  title: string
  variant?: 'dashboard' | 'chat' | 'sidebar'
}

export function EmptyState({ description, title, variant = 'chat' }: EmptyStateProps) {
  const Icon = variant === 'dashboard' ? MessageCircle : Hash
  const isSidebar = variant === 'sidebar'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        'rounded-2xl border border-white/10 bg-white/[0.045] text-center shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl',
        isSidebar ? 'mx-auto w-full max-w-[240px] p-3' : 'mx-auto max-w-xs p-4',
      ].join(' ')}
    >
      <div
        className={[
          'mx-auto grid place-items-center rounded-full border border-[#18D6A3]/20 bg-[#18D6A3]/12 text-[#7FFFE0] shadow-lg shadow-[#18D6A3]/10',
          isSidebar ? 'mb-2 size-8' : 'mb-3 size-9',
        ].join(' ')}
      >
        <Icon size={isSidebar ? 16 : 18} aria-hidden="true" />
      </div>
      <p className={isSidebar ? 'room-font-display text-xs font-semibold text-white' : 'room-font-display text-sm font-semibold text-white'}>{title}</p>
      <p
        className={[
          'room-font-body mx-auto text-zinc-500',
          isSidebar ? 'mt-1 max-w-full text-xs leading-4' : 'mt-1.5 max-w-52 text-sm leading-5',
        ].join(' ')}
      >
        {description}
      </p>
    </motion.div>
  )
}
