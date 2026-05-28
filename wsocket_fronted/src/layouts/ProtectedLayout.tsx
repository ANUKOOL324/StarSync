import { Outlet } from 'react-router-dom'

export function ProtectedLayout() {
  return (
    <main className="neon-field min-h-dvh overflow-hidden">
      <Outlet />
    </main>
  )
}
