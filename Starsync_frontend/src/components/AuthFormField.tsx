import type { InputHTMLAttributes } from 'react'

type AuthFormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function AuthFormField({ label, error, id, ...props }: AuthFormFieldProps) {
  return (
    <label className="grid gap-2 text-sm text-zinc-200" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        className="rounded-lg border border-white/10 bg-[#0B0D0F]/72 px-4 py-3 text-zinc-100 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition placeholder:text-zinc-500 focus:border-[#DCDDDF]/45 focus:ring-4 focus:ring-white/10"
        {...props}
      />
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  )
}
