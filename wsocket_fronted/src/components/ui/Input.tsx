import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        'min-w-0 rounded-lg border border-white/10 bg-white/92 px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-500 focus:border-teal-300 focus:ring-4 focus:ring-teal-300/15',
        className,
      ].join(' ')}
      {...props}
    />
  )
}
