export type ChatMessage = {
  mess: string
  senderId: string
  createdAt?: string
  isOwn?: boolean
}

export type ChatRoom = {
  id: string
  name: string
  slug: string
  description: string
  unreadCount?: number
  isActive?: boolean
}

export type OnlineUser = {
  id: string
  name: string
  status: 'online' | 'idle'
}
