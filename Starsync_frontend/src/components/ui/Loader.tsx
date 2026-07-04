function MessageSkeleton({ align = 'left' }: { align?: 'left' | 'right' }) {
  const isRightAligned = align === 'right'

  return (
    <div className={['flex gap-3', isRightAligned ? 'justify-end' : 'justify-start'].join(' ')}>
      {!isRightAligned ? (
        <div className="size-10 shrink-0 animate-pulse rounded-full border border-white/10 bg-white/[0.055] shadow-lg shadow-black/20" />
      ) : null}
      <div className={['grid max-w-[68%] gap-2', isRightAligned ? 'justify-items-end' : 'justify-items-start'].join(' ')}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-20 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-2.5 w-12 animate-pulse rounded-full bg-white/[0.035]" />
        </div>
        <div
          className={[
            'animate-pulse rounded-2xl border border-white/10 shadow-lg shadow-black/20 backdrop-blur-xl',
            isRightAligned
              ? 'h-16 w-72 rounded-br-md bg-[#18D6A3]/12'
              : 'h-16 w-80 rounded-bl-md bg-white/[0.045]',
          ].join(' ')}
        />
      </div>
    </div>
  )
}

export function Loader() {
  return (
    <div className="grid gap-5" aria-label="Loading messages">
      <div className="my-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/8" />
        <div className="h-7 w-28 animate-pulse rounded-full border border-white/10 bg-white/[0.045] backdrop-blur-xl" />
        <div className="h-px flex-1 bg-white/8" />
      </div>
      <MessageSkeleton />
      <MessageSkeleton align="right" />
      <MessageSkeleton />
    </div>
  )
}
