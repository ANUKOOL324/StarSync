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
  joinCode?: string
  maxMembers?: number | null
  description: string
  type?: 'GROUP' | 'DM'
  purpose?: 'COLLABORATIVE' | 'COMPETING'
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | null
  topics?: string[]
  durationMinutes?: number | null
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
  role: 'ADMIN' | 'MEMBER'
  joinedAt: string
  isOnline?: boolean
}

export type TypingUser = {
  id: string
  username: string
}


