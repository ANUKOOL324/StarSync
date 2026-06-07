import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        'min-w-0 rounded-lg border border-white/10 bg-[#18181B] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#18D6A3] focus:ring-4 focus:ring-[#18D6A3]/15',
        className,
      ].join(' ')}
      {...props}
    />
  )
}
