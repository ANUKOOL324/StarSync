const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL ?? 'ws://localhost:3001'

export const createChatSocket = (token: string) => {
  const url = new URL(websocketUrl)
  url.searchParams.set('token', token)

  return new WebSocket(url.toString())
}
