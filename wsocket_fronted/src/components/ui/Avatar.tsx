type AvatarProps = {
  name: string
  seed?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  type?: 'room' | 'user'
}

const sizeClasses = {
  xs: 'size-7',
  sm: 'size-9',
  md: 'size-10',
  lg: 'size-12',
}

const buildAvatarUrl = (seed: string, type: 'room' | 'user') => {
  const encodedSeed = encodeURIComponent(seed || 'workspace')
  const avatarStyle = type === 'room' ? 'shapes' : 'notionists-neutral'

  return `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodedSeed}`
}

export function Avatar({ name, seed, size = 'md', type = 'user' }: AvatarProps) {
  const avatarSeed = seed ?? name
  const avatarUrl = buildAvatarUrl(avatarSeed, type)

  return (
    <span
      className={[
        'block shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#18181B] shadow-sm shadow-black/20',
        sizeClasses[size],
      ].join(' ')}
    >
      <img src={avatarUrl} alt={`${name} avatar`} className="h-full w-full object-cover" />
    </span>
  )
}
