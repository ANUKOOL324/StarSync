const DEFAULT_WEBSOCKET_URL = 'ws://localhost:3001/ws'

const resolveWebSocketUrl = (url: string) => {
  if (url.startsWith('/')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}${url}`
  }

  return url
}

const websocketUrl = resolveWebSocketUrl(
  import.meta.env.VITE_WS_URL ?? import.meta.env.VITE_WEBSOCKET_URL ?? DEFAULT_WEBSOCKET_URL,
)

export const createChatSocket = () => {
  return new WebSocket(websocketUrl)
}
