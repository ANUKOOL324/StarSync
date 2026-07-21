type FloatingErrorNotificationProps = {
  message: string | null
}

export function FloatingErrorNotification({ message }: FloatingErrorNotificationProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="fixed right-4 top-4 z-[70] w-[min(14rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white/90 shadow-[0_12px_34px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-2.5">
        <span className="size-1.5 shrink-0 rounded-full bg-white/70" />
        <p className="min-w-0 truncate font-medium leading-5">{message}</p>
      </div>
      <div className="mt-2 h-px overflow-hidden rounded-full bg-white/10">
        <div className="h-full animate-[dashboard-error-progress_3s_linear_forwards] rounded-full bg-white/55" />
      </div>
      <style>{`
        @keyframes dashboard-error-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
