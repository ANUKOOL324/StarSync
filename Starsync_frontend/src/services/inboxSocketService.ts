import type { InboxMessageEvent } from '../types/chat'

import { createSocketIoChatSocket, type ChatSocket } from './socketIoService'

type InboxMessageHandler = (payload: InboxMessageEvent) => void

let inboxSocket: ChatSocket | null = null
let inboxHandler: InboxMessageHandler | null = null
let connectedUserId: string | null = null

const dispatchInboxMessage = (payload: InboxMessageEvent) => {
  inboxHandler?.(payload)
}

const attachInboxListener = (socket: ChatSocket) => {
  socket.off('inbox:message')
  socket.on('inbox:message', dispatchInboxMessage)
}

export const inboxSocketService = {
  connect(userId: string) {
    if (connectedUserId && connectedUserId !== userId) {
      this.disconnect()
    }

    if (inboxSocket?.connected && connectedUserId === userId) {
      return
    }

    if (inboxSocket) {
      inboxSocket.removeAllListeners()
      inboxSocket.disconnect()
      inboxSocket = null
    }

    connectedUserId = userId
    inboxSocket = createSocketIoChatSocket()
    attachInboxListener(inboxSocket)
    inboxSocket.connect()
  },

  disconnect() {
    if (inboxSocket) {
      inboxSocket.removeAllListeners()
      inboxSocket.disconnect()
      inboxSocket = null
    }

    connectedUserId = null
  },

  setHandler(handler: InboxMessageHandler | null) {
    inboxHandler = handler
  },
}
