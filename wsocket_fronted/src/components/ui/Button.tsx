import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'ghost'
}

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  const variants = {
    primary:
      'bg-teal-300 text-zinc-950 shadow-lg shadow-teal-500/20 hover:bg-teal-200 disabled:opacity-60',
    ghost: 'border border-white/10 text-zinc-200 hover:bg-white/10 hover:text-white',
  }

  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
