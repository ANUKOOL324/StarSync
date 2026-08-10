import { useEffect } from 'react'

import { inboxSocketService } from '../services/inboxSocketService'
import { useAuth } from './useAuth'

export function useInboxSocketLifecycle() {
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      inboxSocketService.disconnect()
      return
    }

    inboxSocketService.connect(user.id)

    return () => {
      inboxSocketService.disconnect()
    }
  }, [isAuthenticated, user?.id])
}
