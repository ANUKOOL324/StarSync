import { apiClient } from './apiClient'
import type { ChatUser } from '../types/chat'

export const userService = {
  search: async (query: string) => {
    const response = await apiClient.get<{ users: ChatUser[] }>('/users/search', {
      params: { query },
    })

    return response.data.users
  },
}
