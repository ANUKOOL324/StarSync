import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { authService } from '../services/authService'
import type { AuthUser, LoginPayload, SignupPayload } from '../types/auth'
import { AuthContext } from './authContextCore'

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  logout: () => Promise<void>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        setUser(await authService.me())
      } catch {
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
        setUser(result.user)
      },
      signup: async (payload) => {
        const result = await authService.signup(payload)
        setUser(result.user)
      },
      logout: async () => {
        try {
          await authService.logout()
        } finally {
          setUser(null)
          window.location.replace('/')
        }
      },
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
