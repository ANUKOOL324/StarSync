export type ChatUser = {
  id: string
  username: string
  email: string
}

export type ChatMessage = {
  id?: string
  clientMessageId?: string
  mess: string
  content?: string
  senderId: string
  roomId?: string
  createdAt?: string
  isOwn?: boolean
  status?: 'sending' | 'sent' | 'failed'
  sender?: ChatUser
}

export type ChatRoom = {
  id: string
  name: string
  slug: string
  description: string
  type?: 'GROUP' | 'DM'
  createdAt?: string
  adminId?: string
  admin?: ChatUser
  otherUser?: ChatUser | null
  lastMessage?: ChatMessage | null
  unreadCount?: number
  isActive?: boolean
  _count?: {
    members?: number
    messages: number
  }
}

export type OnlineUser = {
  id: string
  username: string
  email: string
}

export type RoomMember = ChatUser & {
  isOnline?: boolean
}

export type TypingUser = {
  id: string
  username: string
}
