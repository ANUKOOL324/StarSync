import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'ghost'
}

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  const variants = {
    primary:
      'border border-white/10 bg-[#18D6A3] text-[#03110E] shadow-lg shadow-[#18D6A3]/18 hover:bg-[#35E0B4] disabled:opacity-60',
    ghost: 'border border-white/10 bg-white/[0.03] text-slate-200 hover:border-[#18D6A3]/25 hover:bg-white/[0.07] hover:text-white',
  }

  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
