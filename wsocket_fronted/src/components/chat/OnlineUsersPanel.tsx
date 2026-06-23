import { useState } from 'react'
import { CalendarDays, Check, Copy, Crown, UserMinus, Users, X } from 'lucide-react'

import type { ChatRoom, OnlineUser, RoomMember } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

type OnlineUsersPanelProps = {
  currentUserId?: string
  isCurrentUserAdmin: boolean
  isOpen: boolean
  isLoadingMembers: boolean
  membersError: string | null
  onClose?: () => void
  onRequestRemoveMember?: (member: RoomMember) => void
  onlineUsers: OnlineUser[]
  removingMemberId?: string | null
  room: ChatRoom
  roomMembers: RoomMember[]
}

const formatCreatedDate = (value?: string) => {
  if (!value) return 'Unknown'

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const getRoleBadgeClassName = (role: RoomMember['role']) => {
  if (role === 'ADMIN') {
    return 'border-[#FACC15]/25 bg-[#FACC15]/10 text-[#FDE68A]'
  }

  return 'border-white/10 bg-white/[0.04] text-[#BACAC5]'
}

export function OnlineUsersPanel({
  currentUserId,
  isCurrentUserAdmin,
  isOpen,
  isLoadingMembers,
  membersError,
  onClose,
  onRequestRemoveMember,
  onlineUsers,
  removingMemberId,
  room,
  roomMembers,
}: OnlineUsersPanelProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const onlineCount = onlineUsers.length
  const isDirectMessage = room.type === 'DM'

  const handleCopyCode = async () => {
    if (!room.joinCode) return
    try {
      await navigator.clipboard.writeText(room.joinCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      console.error('Failed to copy room code', error)
    }
  }
  const displayMemberCount = roomMembers.length || room._count?.members || 0
  const memberLabel = displayMemberCount === 1 ? 'member' : 'members'
  const ownerName = room.admin?.username ?? 'Room admin'
  const onlineUserIds = new Set(onlineUsers.map((user) => user.id))

  return (
    <aside
      className={[
        'neon-field !fixed inset-y-0 right-0 z-50 flex h-dvh w-[min(90vw,20rem)] flex-col overflow-y-auto bg-[#09090B]/95 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl transition-transform duration-200 xl:!static xl:z-auto xl:h-full xl:max-w-none xl:shrink-0 xl:translate-x-0 xl:transition-[width] xl:duration-200',
        isOpen
          ? 'translate-x-0 border-l border-white/10'
          : 'translate-x-full pointer-events-none xl:pointer-events-auto',
        isOpen
          ? 'xl:w-full'
          : 'xl:w-0 xl:overflow-hidden xl:border-l-0 xl:p-0',
      ].join(' ')}
      aria-hidden={!isOpen}
    >
      <div className="relative grid gap-3">
        <div className="rounded-2xl bg-gradient-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <section className="relative flex flex-col overflow-hidden rounded-[14px] bg-[#18181B]/78 p-4 backdrop-blur-2xl">
            <span className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[#57F1DB]/[0.03] blur-xl" />
            <div className="relative mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F7F7F8]">
                  {isDirectMessage ? 'Direct Message Details' : 'Room Details'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="grid size-8 place-items-center rounded-lg border border-[#18D6A3]/25 bg-gradient-to-b from-[#18D6A3]/15 to-[#18D6A3]/5 text-[#18D6A3] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <span className="shrink-0"><Users size={15} aria-hidden="true" /></span>
                </span>
                {onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40 xl:hidden cursor-pointer"
                    aria-label="Close Room Details"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>

            <dl className="relative grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                <dt className="text-[#BACAC5]">Members</dt>
                <dd className="font-medium text-[#F7F7F8]">
                  {room.maxMembers ? `${displayMemberCount} / ${room.maxMembers} ${memberLabel}` : `${displayMemberCount} / ∞`}
                </dd>
              </div>
              {!isDirectMessage ? (
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="text-[#BACAC5]">Room code</dt>
                  <dd className="flex items-center gap-2 font-mono text-xs font-medium text-[#D6FFF6]">
                    <span className="max-w-28 truncate">{room.joinCode ?? 'No code'}</span>
                    {room.joinCode ? (
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1 text-[#A7B8B3] hover:text-[#D6FFF6] transition cursor-pointer"
                        title="Copy room code"
                      >
                        {copiedCode ? (
                          <>
                            <Check size={11} className="text-[#22C55E]" />
                            <span className="text-[#22C55E] text-[9px] font-sans font-semibold">Copied</span>
                          </>
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                <dt className="flex items-center gap-2 text-[#BACAC5]">
                  <span className="shrink-0"><CalendarDays size={14} aria-hidden="true" /></span>
                  Created
                </dt>
                <dd className="text-right font-medium text-[#F7F7F8]">{formatCreatedDate(room.createdAt)}</dd>
              </div>
              {!isDirectMessage ? (
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="flex items-center gap-2 text-[#BACAC5]">
                    <span className="shrink-0"><Crown size={14} aria-hidden="true" /></span>
                    Owner
                  </dt>
                  <dd className="max-w-32 truncate text-right font-medium text-[#F7F7F8]">{ownerName}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <section className="relative flex flex-col overflow-hidden rounded-[14px] bg-[#18181B]/78 p-4 backdrop-blur-2xl">
            <span className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[#57F1DB]/[0.03] blur-xl" />
            <div className="relative flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#F7F7F8]">Room members</p>
              <p className="rounded-full border border-[#22C55E]/25 bg-gradient-to-b from-[#22C55E]/15 to-[#22C55E]/5 px-2.5 py-1 text-xs font-medium text-[#86EFAC] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                {onlineCount} Online
              </p>
            </div>

            <div className="relative mt-4 grid gap-3">
              {isLoadingMembers ? (
                [0, 1, 2].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-1.5">
                    <span className="size-9 rounded-full bg-white/10" />
                    <span className="grid flex-1 gap-1.5">
                      <span className="h-3 w-24 rounded-full bg-white/10" />
                      <span className="h-2.5 w-16 rounded-full bg-white/[0.07]" />
                    </span>
                  </div>
                ))
              ) : null}

              {!isLoadingMembers && membersError ? (
                <p className="rounded-xl border border-red-300/20 bg-red-950/20 px-3 py-4 text-sm text-red-200">
                  {membersError}
                </p>
              ) : null}

              {!isLoadingMembers && !membersError ? roomMembers.map((member) => {
                const memberIsOnline = onlineUserIds.has(member.id)
                const canRemoveMember = Boolean(
                  isCurrentUserAdmin &&
                  !isDirectMessage &&
                  member.id !== currentUserId &&
                  member.role === 'MEMBER' &&
                  onRequestRemoveMember,
                )

                return (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-transparent p-1.5 transition hover:border-white/8 hover:bg-white/[0.035]">
                    <Avatar name={member.username} seed={member.username || member.email} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-medium text-[#F7F7F8]">{member.username}</p>
                        <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getRoleBadgeClassName(member.role)}`}>
                          {member.role}
                        </span>
                      </div>
                      <p className="truncate text-xs text-[#BACAC5]">{member.email}</p>
                    </div>
                    {canRemoveMember ? (
                      <button
                        type="button"
                        onClick={() => onRequestRemoveMember?.(member)}
                        disabled={removingMemberId === member.id}
                        className="grid size-8 shrink-0 place-items-center rounded-lg border border-red-300/15 text-red-200 transition hover:bg-red-950/30 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        aria-label={`Remove ${member.username}`}
                      >
                        <UserMinus size={15} aria-hidden="true" />
                      </button>
                    ) : (
                      <span
                        className={[
                          'size-2 shrink-0 rounded-full',
                          memberIsOnline ? 'bg-[#22C55E] shadow-[0_0_12px_rgba(34,197,94,0.55)]' : 'bg-zinc-600',
                        ].join(' ')}
                      />
                    )}
                  </div>
                )
              }) : null}

              {!isLoadingMembers && !membersError && !roomMembers.length ? (
                <p className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-4 text-sm text-zinc-500">
                  No members found yet.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </aside>
  )
}
