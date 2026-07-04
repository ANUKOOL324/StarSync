export function WhiteboardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#05080A]/80">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="grid gap-2">
          <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-52 animate-pulse rounded-full bg-white/[0.07]" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-full border border-white/10 bg-white/[0.06]" />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_1px_1px,rgba(24,214,163,0.3)_1px,transparent_0)] [background-size:18px_18px]" />
        <div className="absolute left-6 top-6 h-12 w-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]" />
        <div className="absolute right-8 top-20 h-28 w-52 animate-pulse rounded-3xl border border-white/10 bg-white/4" />
        <div className="absolute bottom-8 left-1/2 h-14 w-[min(28rem,80vw)] -translate-x-1/2 animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]" />
      </div>
    </div>
  )
}
