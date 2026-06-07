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
      avatarSeed: room.slug || room.name || room.id,
      displayName: room.name || 'Room',
      isDirectMessage: false,
      subtitle: room.slug ? `#${room.slug}` : 'Group room',
    }
  }

  // GET /api/v1/dms already returns otherUser for the current logged-in user.
  // If that data is missing, keep the UI human-readable instead of showing dm-* slugs.
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
