import { Outlet } from 'react-router-dom'

import { Sidebar } from '../components/Sidebar'

export function AppLayout() {
  return (
    <div className="neon-field min-h-dvh md:flex">
      <Sidebar />
      <main className="min-h-[calc(100dvh-6rem)] flex-1 overflow-hidden md:min-h-dvh">
        <Outlet />
      </main>
    </div>
  )
}
