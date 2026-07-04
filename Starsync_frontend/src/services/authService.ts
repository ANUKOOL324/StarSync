import { apiClient } from './apiClient'
import type { AuthResponse, AuthUser, LoginPayload, SignupPayload } from '../types/auth'

export const authService = {
  signup: async (payload: SignupPayload) => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', payload)
    return response.data
  },
  login: async (payload: LoginPayload) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload)
    return response.data
  },
  logout: async () => {
    await apiClient.post('/auth/logout')
  },
  me: async () => {
    const response = await apiClient.get<{ user: AuthUser }>('/auth/me')
    return response.data.user
  },
}
