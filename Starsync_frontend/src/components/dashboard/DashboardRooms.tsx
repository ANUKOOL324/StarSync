import { Search } from 'lucide-react'

import type { ChatRoom } from '../../types/chat'
import { EmptyState } from '../chat/EmptyState'
import { Card } from '../ui/card'
import { Input } from '../ui/Input'
import { PulseLoader } from '../ui/PulseLoader'
import { Separator } from '../ui/separator'
import { RealRoomCard } from './DashboardCards'

type DashboardRoomsProps = {
  createdCount: number
  isLoading: boolean
  joinedCount: number
  onOpenRoom: (room: ChatRoom) => void
  onSearchChange: (value: string) => void
  roomError: string | null
  rooms: ChatRoom[]
  searchQuery: string
}

export function DashboardRooms({
  createdCount,
  isLoading,
  joinedCount,
  onOpenRoom,
  onSearchChange,
  roomError,
  rooms,
  searchQuery,
}: DashboardRoomsProps) {
  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-3xl text-center">
        <h2 className="dashboard-section-heading">Your Rooms</h2>
        <p className="dashboard-body-copy mt-3">Search, manage, and open your joined workspaces.</p>
        <div className="mt-5 flex justify-center gap-3">
          {[
            ['Created', createdCount],
            ['Joined', joinedCount],
          ].map(([label, value]) => (
            <div key={label} className="min-w-24 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
              <span className="dashboard-kicker block">{label}</span>
              <span className="mt-1 block font-mono text-lg font-bold leading-none text-[#D6FFF6]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-xl">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#70817D]" aria-hidden="true" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search your rooms..."
            className="h-12 rounded-xl bg-black/22 pl-11 text-base placeholder:text-[#5F6B68] focus:border-[#57F1DB]/35"
          />
        </div>
      </div>

      <Separator />
      <section className="space-y-4">
        {isLoading ? (
          <PulseLoader className="bg-white/3" />
        ) : roomError ? (
          <Card className="border border-red-300/20 bg-red-950/20 p-4 text-sm text-red-200">{roomError}</Card>
        ) : rooms.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <RealRoomCard
                key={room.id}
                roomName={room.name}
                purpose={room.purpose}
                roomCode={room.joinCode}
                membersCount={room._count?.members ?? 0}
                onClick={() => onOpenRoom(room)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            variant="dashboard"
            title="No rooms found"
            description={searchQuery ? 'No matching rooms found.' : 'Create a room from Workspace, then it will appear here.'}
          />
        )}
      </section>
    </div>
  )
}
