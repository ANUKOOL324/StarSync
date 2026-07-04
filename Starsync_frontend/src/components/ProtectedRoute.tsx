import { Navigate, Outlet } from 'react-router-dom'

import { PulseLoader } from './ui/PulseLoader'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <PulseLoader fullscreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}