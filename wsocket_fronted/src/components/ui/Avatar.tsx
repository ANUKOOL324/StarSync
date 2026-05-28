type AvatarProps = {
  name: string
  tone?: 'teal' | 'dark'
}

export function Avatar({ name, tone = 'teal' }: AvatarProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() || '?'

  return (
    <span
      className={[
        'grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold ring-1',
        tone === 'teal'
          ? 'bg-teal-300 text-zinc-950 ring-teal-100/50'
          : 'bg-white/10 text-zinc-100 ring-white/10',
      ].join(' ')}
    >
      {initial}
    </span>
  )
}
