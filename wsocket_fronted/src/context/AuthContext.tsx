import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { authService } from '../services/authService'
import type { AuthUser, LoginPayload, SignupPayload } from '../types/auth'
import { tokenStorage } from '../utils/tokenStorage'
import { AuthContext } from './authContextCore'

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  logout: () => void
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const token = tokenStorage.get()

      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setUser(await authService.me())
      } catch {
        tokenStorage.clear()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadUser()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login: async (payload) => {
        const result = await authService.login(payload)
        tokenStorage.set(result.token)
        setUser(result.user)
      },
      signup: async (payload) => {
        const result = await authService.signup(payload)
        tokenStorage.set(result.token)
        setUser(result.user)
      },
      logout: () => {
        tokenStorage.clear()
        setUser(null)
      },
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
