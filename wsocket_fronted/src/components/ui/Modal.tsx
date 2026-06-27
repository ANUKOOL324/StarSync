import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type ModalProps = {
  children: ReactNode
  title: string
  isOpen: boolean
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  hideHeader?: boolean
}

export function Modal({ children, className = '', isOpen, onClose, title, size = 'md', hideHeader = false }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`w-full ${sizeClasses[size]} rounded-lg border border-white/10 bg-zinc-950/90 p-5 shadow-2xl shadow-black/50 ${className}`}
      >
        {!hideHeader && (
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}
        {children}
      </motion.div>
    </div>
  )
}
