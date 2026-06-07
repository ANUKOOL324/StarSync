import { apiClient } from './apiClient'

type LiveblocksAuthResponse = {
  token: string
}

export const liveblocksService = {
  async authorizeRoom(room: string) {
    const response = await apiClient.post<LiveblocksAuthResponse>('/liveblocks/auth', {
      room,
    })

    return response.data
  },
}
