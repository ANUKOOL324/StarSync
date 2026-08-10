import { Outlet } from 'react-router-dom'

import { useInboxSocketLifecycle } from '../hooks/useInboxSocketLifecycle'

export function ProtectedLayout() {
  useInboxSocketLifecycle()

  return (
    <main className="neon-field min-h-dvh">
      <Outlet />
    </main>
  )
}
