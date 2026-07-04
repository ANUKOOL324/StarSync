export function EditorSkeleton() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#05080A]/75 px-4 py-3">
        <div className="grid gap-2">
          <span className="h-4 w-28 rounded-full bg-white/10" />
          <span className="h-3 w-44 rounded-full bg-white/[0.07]" />
        </div>
        <div className="flex gap-2">
          <span className="h-9 w-28 rounded-xl bg-white/10" />
          <span className="h-9 w-24 rounded-xl bg-[#18D6A3]/20" />
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 p-4">
        <div className="h-full rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="grid gap-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <span
                key={index}
                className="h-3 rounded-full bg-white/[0.06]"
                style={{ width: `${Math.max(28, 92 - index * 5)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="h-44 shrink-0 border-t border-white/10 bg-[#05080A]/70 p-4">
        <span className="block h-4 w-24 rounded-full bg-white/10" />
        <span className="mt-4 block h-3 w-64 rounded-full bg-white/[0.06]" />
      </div>
    </div>
  )
}
