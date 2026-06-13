import type { ChatRoom } from '../types/chat'

export type RoomDisplayInfo = {
  avatarName: string
  avatarSeed: string
  displayName: string
  isDirectMessage: boolean
  subtitle: string
}

export const getRoomDisplayInfo = (room: ChatRoom): RoomDisplayInfo => {
  const isDirectMessage = room.type === 'DM'

  if (!isDirectMessage) {
    return {
      avatarName: room.name || 'Room',
      avatarSeed: room.joinCode || room.slug || room.name || room.id,
      displayName: room.name || 'Room',
      isDirectMessage: false,
      subtitle: room.joinCode ? `Room code ${room.joinCode}` : 'Group room',
    }
  }

  const otherUser = room.otherUser
  const fallbackName = 'Direct Message'
  const displayName = otherUser?.username || fallbackName

  return {
    avatarName: displayName,
    avatarSeed: otherUser?.email || otherUser?.username || room.id,
    displayName,
    isDirectMessage: true,
    subtitle: otherUser ? 'Direct message' : 'Private conversation',
  }
}
