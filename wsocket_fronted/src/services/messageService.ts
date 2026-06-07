import { apiClient } from './apiClient'
import type { ChatMessage } from '../types/chat'

const normalizeMessage = (message: ChatMessage): ChatMessage => ({
  ...message,
  mess: message.mess ?? message.content ?? '',
})

export const messageService = {
  history: async (roomId: string, cursor?: string) => {
    const response = await apiClient.get<{
      messages: ChatMessage[]
      nextCursor: string | null
    }>(`/messages/${roomId}`, {
      params: { limit: 50, cursor },
    })

    return {
      messages: response.data.messages.map(normalizeMessage),
      nextCursor: response.data.nextCursor,
    }
  },
}
