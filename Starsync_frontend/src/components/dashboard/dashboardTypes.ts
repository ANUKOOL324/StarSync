import type { ReactNode } from 'react'

export type DashboardTab = 'home' | 'rooms'
export type RoomPurpose = 'COLLABORATIVE' | 'COMPETING'
export type RoomDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type CreationStage = 'idle' | 'creating' | 'success'

export type WorkspaceTemplate = {
  title: string
  description: string
  icon: ReactNode
  defaultRoomName: string
  purpose: RoomPurpose
}

export type StaticRoomPreview = {
  title: string
  roomType: string
  description: string
  badge: 'Free' | 'Paid'
}
