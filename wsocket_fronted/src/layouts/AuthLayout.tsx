import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="neon-field relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10">
      <div className="absolute inset-0 bg-black/28" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-black/45" />
      <div className="relative z-10 w-full">
        <Outlet />
      </div>
    </main>
  )
}
