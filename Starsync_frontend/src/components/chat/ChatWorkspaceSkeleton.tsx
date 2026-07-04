function SkeletonSurface({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={['animate-pulse bg-white/[0.06]', className].join(' ')}
    />
  )
}

function SidebarRoomSkeleton({ isActive = false }: { isActive?: boolean }) {
  return (
    <div
      className={[
        'rounded-2xl border px-3 py-3 backdrop-blur-xl',
        isActive ? 'border-[#18D6A3]/20 bg-[#18D6A3]/10' : 'border-transparent bg-white/[0.025]',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <SkeletonSurface className="size-10 rounded-full" />
        <div className="min-w-0 flex-1">
          <SkeletonSurface className="h-3.5 w-28 rounded-full" />
          <SkeletonSurface className="mt-2 h-2.5 w-20 rounded-full bg-white/[0.035]" />
          <SkeletonSurface className="mt-2 h-2 w-14 rounded-full bg-white/3" />
        </div>
        {!isActive ? <SkeletonSurface className="h-5 w-6 rounded-full" /> : null}
      </div>
    </div>
  )
}

function ChatMessageSkeleton({ align = 'left' }: { align?: 'left' | 'right' }) {
  const isRightAligned = align === 'right'

  return (
    <div className={['flex gap-3', isRightAligned ? 'justify-end' : 'justify-start'].join(' ')}>
      {!isRightAligned ? <SkeletonSurface className="size-10 rounded-full" /> : null}
      <div className={['grid max-w-[68%] gap-2', isRightAligned ? 'justify-items-end' : 'justify-items-start'].join(' ')}>
        <div className="flex items-center gap-2">
          <SkeletonSurface className="h-3 w-20 rounded-full" />
          <SkeletonSurface className="h-2.5 w-12 rounded-full bg-white/3" />
        </div>
        <SkeletonSurface
          className={[
            'h-16 rounded-2xl',
            isRightAligned ? 'w-72 rounded-br-md bg-[#18D6A3]/12' : 'w-80 rounded-bl-md',
          ].join(' ')}
        />
      </div>
    </div>
  )
}

export function ChatWorkspaceSkeleton() {
  return (
    <section className="relative flex h-dvh max-h-dvh w-full overflow-hidden lg:flex-row" aria-label="Loading chat workspace">
      <aside className="neon-field hidden w-[18rem] shrink-0 border-r border-white/10 bg-[#09090B]/86 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-3">
            <SkeletonSurface className="size-10 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <SkeletonSurface className="h-3.5 w-20 rounded-full" />
              <SkeletonSurface className="mt-2 h-2.5 w-32 rounded-full bg-white/3" />
            </div>
          </div>
          <SkeletonSurface className="mt-5 h-11 rounded-2xl bg-[#18D6A3]/12" />
          <SkeletonSurface className="mt-3 h-10 rounded-2xl" />
          <div className="mt-5 min-h-0 flex-1">
            <SkeletonSurface className="mb-3 h-3 w-16 rounded-full bg-white/[0.025]" />
            <div className="grid gap-2">
              <SidebarRoomSkeleton />
              <SidebarRoomSkeleton isActive />
              <SidebarRoomSkeleton />
              <SidebarRoomSkeleton />
            </div>
          </div>
          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-2.5 backdrop-blur-xl">
              <SkeletonSurface className="size-10 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonSurface className="h-3.5 w-24 rounded-full" />
                <SkeletonSurface className="mt-2 h-2.5 w-36 rounded-full bg-white/3" />
              </div>
              <SkeletonSurface className="size-8 rounded-xl" />
            </div>
          </div>
        </div>
      </aside>

      <main className="neon-field flex min-w-0 flex-1 flex-col bg-[#09090B]">
        <header className="sticky top-0 z-20 min-h-[76px] shrink-0 overflow-hidden border-b border-white/10 bg-white/[0.035] px-3 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_0%,rgba(24,214,163,0.14),transparent_18rem),radial-gradient(circle_at_92%_0%,rgba(24,214,163,0.09),transparent_16rem)]" />
          <div className="relative flex min-h-[76px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <SkeletonSurface className="size-12 rounded-full" />
              <div className="min-w-0">
                <SkeletonSurface className="h-4 w-36 rounded-full" />
                <SkeletonSurface className="mt-2 h-3 w-24 rounded-full bg-white/3" />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SkeletonSurface className="hidden h-9 w-20 rounded-full sm:block" />
              <SkeletonSurface className="hidden h-9 w-24 rounded-full sm:block" />
              <SkeletonSurface className="size-9 rounded-lg" />
              <SkeletonSurface className="size-9 rounded-lg" />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-5xl gap-5">
            <div className="my-1 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/8" />
              <SkeletonSurface className="h-7 w-28 rounded-full bg-white/[0.035]" />
              <div className="h-px flex-1 bg-white/8" />
            </div>
            <ChatMessageSkeleton />
            <ChatMessageSkeleton align="right" />
            <ChatMessageSkeleton />
            <ChatMessageSkeleton align="right" />
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.025] px-4 py-3 shadow-[0_-22px_55px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/45 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <SkeletonSurface className="h-11 flex-1 rounded-xl bg-white/3" />
            <SkeletonSurface className="size-10 rounded-xl bg-[#18D6A3]/14" />
          </div>
        </div>
      </main>

      <aside className="neon-field hidden w-72 shrink-0 border-l border-white/10 bg-[#09090B]/82 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl lg:block xl:w-80">
        <div className="relative grid gap-3">
          <section className="rounded-2xl border border-white/10 bg-white/4 p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <SkeletonSurface className="h-3.5 w-24 rounded-full" />
                <SkeletonSurface className="mt-2 h-2.5 w-32 rounded-full bg-white/3" />
              </div>
              <SkeletonSurface className="size-8 rounded-full" />
            </div>
            <div className="grid gap-3 border-t border-white/8 pt-3">
              <SkeletonSurface className="h-5 rounded-full" />
              <SkeletonSurface className="h-5 rounded-full" />
              <SkeletonSurface className="h-5 rounded-full" />
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/4 p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SkeletonSurface className="h-3.5 w-24 rounded-full" />
              <SkeletonSurface className="h-7 w-16 rounded-full bg-[#22C55E]/10" />
            </div>
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl p-1.5">
                  <SkeletonSurface className="size-9 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <SkeletonSurface className="h-3.5 w-24 rounded-full" />
                    <SkeletonSurface className="mt-2 h-2.5 w-14 rounded-full bg-white/3" />
                  </div>
                  <SkeletonSurface className="size-2 rounded-full bg-[#22C55E]/15" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </section>
  )
}
