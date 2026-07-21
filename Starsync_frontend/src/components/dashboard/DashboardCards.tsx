import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '../ui/badge'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import type { RoomPurpose, StaticRoomPreview } from './dashboardTypes'

const cardFrameClassName =
  'rounded-2xl bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 cursor-pointer'

const actionCardClassName =
  'relative flex h-full min-h-[7.25rem] flex-col justify-between overflow-hidden rounded-[14px] bg-[#18181B]/78 p-3.5 backdrop-blur-2xl transition duration-300 group-hover:bg-[#1F1F23]/88'

const iconBoxClassName =
  'grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-linear-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#D6FFF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'

type WorkspaceActionCardProps = {
  actionLabel?: string
  description: string
  icon: ReactNode
  onClick: () => void
  title: string
}

export function WorkspaceActionCard({
  actionLabel = 'Create Room',
  description,
  icon,
  onClick,
  title,
}: WorkspaceActionCardProps) {
  return (
    <button type="button" onClick={onClick} className={`${cardFrameClassName} group text-left`}>
      <Card className={actionCardClassName}>
        <span className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[#57F1DB]/4 blur-2xl" />
        <CardHeader className="relative gap-2">
          <div className={iconBoxClassName}>{icon}</div>
          <div className="grid gap-2">
            <CardTitle className="text-base text-[#F7F7F8]">{title}</CardTitle>
            <CardDescription className="max-w-md text-sm leading-5 text-[#BACAC5]">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="relative mt-2">
          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-1 text-sm font-semibold text-[#D6FFF6] transition duration-200 group-hover:border-[#57F1DB]/40 group-hover:bg-[#57F1DB]/10">
            {actionLabel}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </CardFooter>
      </Card>
    </button>
  )
}

type StaticRoomCardProps = {
  onUseTemplate: () => void
  room: StaticRoomPreview
}

export function StaticRoomCard({ onUseTemplate, room }: StaticRoomCardProps) {
  return (
    <button
      type="button"
      onClick={onUseTemplate}
      className="group w-full cursor-pointer text-left transition-transform duration-300 hover:-translate-y-0.5"
    >
      <Card className="flex min-h-[13rem] flex-col justify-between rounded-2xl border border-white/10 bg-[#060A12]/76 p-5 shadow-[0_18px_52px_rgba(0,0,0,0.2)] transition duration-300 group-hover:border-[#57F1DB]/25 group-hover:bg-[#090E17]/86">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[#F7F7F8]">{room.title}</h3>
              <p className="mt-2 text-sm font-medium text-[#D6FFF6]">{room.roomType}</p>
            </div>
            <Badge className={[
              'shrink-0 border-white/8 px-3 py-1 text-xs font-bold',
              room.badge === 'Paid'
                ? 'border-amber-300/25 bg-amber-400/10 text-amber-200'
                : 'bg-[#1F2937]/85 text-white',
            ].join(' ')}>
              {room.badge}
            </Badge>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#E5E7EB]">{room.description}</p>
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full border border-[#57F1DB]/30 bg-[#57F1DB]/10 px-3.5 py-1.5 text-xs font-semibold text-[#D6FFF6] transition duration-300 group-hover:border-[#57F1DB]/50 group-hover:bg-[#57F1DB]/20">
          Join room
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      </Card>
    </button>
  )
}

type RealRoomCardProps = {
  membersCount: number
  onClick: () => void
  purpose?: RoomPurpose
  roomCode?: string
  roomName: string
}

export function RealRoomCard({ membersCount, onClick, purpose, roomCode, roomName }: RealRoomCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group cursor-pointer rounded-2xl bg-linear-to-b from-[#5A5A5C]/70 via-white/12 to-[#28282A]/75 p-[2px] text-left shadow-[0_16px_48px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-0.5"
    >
      <Card className="flex h-full min-h-[9rem] flex-col justify-between rounded-[14px] bg-[#111316]/86 p-5 transition duration-300 group-hover:bg-[#181B1E]/92">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-[#F7F7F8]">{roomName}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className="border-[#57F1DB]/20 bg-[#57F1DB]/8 text-[10px] text-[#D6FFF6]">
                {purpose === 'COMPETING' ? 'Competing' : 'Collaborative'}
              </Badge>
              <span className="text-sm text-[#A7B8B3]">{membersCount} members</span>
            </div>
          </div>
          {roomCode ? (
            <Badge className="shrink-0 border-white/8 bg-white/4 font-mono text-[10px] text-[#BACAC5]">
              {roomCode}
            </Badge>
          ) : null}
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 self-start rounded-xl border border-white/8 bg-black/18 px-3 py-1.5 text-xs font-semibold text-[#D6FFF6] transition group-hover:border-[#57F1DB]/35">
          Open room
          <ArrowRight size={13} aria-hidden="true" />
        </span>
      </Card>
    </button>
  )
}
