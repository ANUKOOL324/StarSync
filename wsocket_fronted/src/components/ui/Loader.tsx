export function Loader() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/8"
        />
      ))}
    </div>
  )
}
