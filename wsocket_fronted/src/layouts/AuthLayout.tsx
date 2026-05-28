import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="neon-field grid min-h-dvh place-items-center px-5 py-10">
      <Outlet />
    </main>
  )
}
