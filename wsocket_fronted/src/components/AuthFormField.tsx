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
        className="rounded-lg border border-white/10 bg-white/92 px-4 py-3 text-zinc-950 outline-none transition placeholder:text-zinc-500 focus:border-teal-300 focus:ring-4 focus:ring-teal-300/15"
        {...props}
      />
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  )
}
