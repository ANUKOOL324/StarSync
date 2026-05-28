const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL ?? 'ws://localhost:3001'

export const createChatSocket = () => new WebSocket(websocketUrl)
