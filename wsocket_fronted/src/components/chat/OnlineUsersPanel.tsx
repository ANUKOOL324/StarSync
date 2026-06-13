import { CalendarDays, Crown, FileCode, Grid, UserMinus, Users, X } from 'lucide-react'
import type { CSSProperties } from 'react'

import type { ChatRoom, OnlineUser, RoomMember } from '../../types/chat'
import type { EditorPresenceUser } from '../../types/editor'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { Avatar } from '../ui/Avatar'

type OnlineUsersPanelProps = {
  activeTab: 'chat' | 'editor' | 'whiteboard'
  currentUserId?: string
  isCurrentUserAdmin: boolean
  isOpen: boolean
  isLoadingMembers: boolean
  membersError: string | null
  onClose?: () => void
  onRequestRemoveMember?: (member: RoomMember) => void
  editorPresenceUsers: EditorPresenceUser[]
  onlineUsers: OnlineUser[]
  panelWidth: number
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

  return 'border-white/10 bg-white/[0.04] text-zinc-400'
}

export function OnlineUsersPanel({
  activeTab,
  currentUserId,
  isCurrentUserAdmin,
  isOpen,
  isLoadingMembers,
  membersError,
  onClose,
  onRequestRemoveMember,
  editorPresenceUsers,
  onlineUsers,
  panelWidth,
  removingMemberId,
  room,
  roomMembers,
}: OnlineUsersPanelProps) {
  const onlineCount = onlineUsers.length
  const isDirectMessage = room.type === 'DM'
  const displayMemberCount = roomMembers.length || room._count?.members || 0
  const memberLabel = displayMemberCount === 1 ? 'member' : 'members'
  const ownerName = room.admin?.username ?? 'Room admin'
  const roomDisplay = getRoomDisplayInfo(room)
  const onlineUserIds = new Set(onlineUsers.map((user) => user.id))
  const editorCollaboratorCount = editorPresenceUsers.length
  const editorCollaboratorLabel = editorCollaboratorCount === 1 ? '1 active' : `${editorCollaboratorCount} active`

  return (
    <aside
      className={[
        'neon-field !fixed inset-y-0 right-0 z-50 flex h-dvh w-[min(90vw,20rem)] flex-col overflow-y-auto bg-[#09090B]/95 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl transition-transform duration-200 xl:!static xl:z-auto xl:h-full xl:max-w-none xl:shrink-0 xl:translate-x-0 xl:transition-[width] xl:duration-200',
        isOpen
          ? 'translate-x-0 border-l border-white/10'
          : 'translate-x-full pointer-events-none xl:pointer-events-auto',
        isOpen
          ? 'xl:w-[var(--details-panel-width)]'
          : 'xl:w-0 xl:overflow-hidden xl:border-l-0 xl:p-0',
      ].join(' ')}
      style={{ '--details-panel-width': `${panelWidth}px` } as CSSProperties}
      aria-hidden={!isOpen}
    >
      <div className="relative grid gap-3">
        {activeTab === 'chat' && (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {isDirectMessage ? 'Direct message details' : 'Room details'}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {isDirectMessage ? roomDisplay.displayName : 'Room overview'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="grid size-8 place-items-center rounded-full border border-[#18D6A3]/20 bg-[#18D6A3]/10 text-[#18D6A3]">
                    <Users size={15} aria-hidden="true" />
                  </span>
                  {onClose ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/40 xl:hidden"
                      aria-label="Close room details"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>

              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="text-zinc-500">Members</dt>
                  <dd className="font-medium text-zinc-100">
                    {displayMemberCount} / {room.maxMembers ?? 'Unlimited'} {memberLabel}
                  </dd>
                </div>
                {!isDirectMessage ? (
                  <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                    <dt className="text-zinc-500">Room code</dt>
                    <dd className="max-w-36 truncate font-mono text-xs font-medium text-[#7FFFE0]">
                      {room.joinCode ?? 'No code'}
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="flex items-center gap-2 text-zinc-500">
                    <CalendarDays size={14} aria-hidden="true" />
                    Created
                  </dt>
                  <dd className="text-right font-medium text-zinc-100">{formatCreatedDate(room.createdAt)}</dd>
                </div>
                {!isDirectMessage ? (
                  <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                    <dt className="flex items-center gap-2 text-zinc-500">
                      <Crown size={14} aria-hidden="true" />
                      Owner
                    </dt>
                    <dd className="max-w-32 truncate text-right font-medium text-zinc-100">{ownerName}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Room members</p>
                <p className="rounded-full border border-[#22C55E]/20 bg-[#22C55E]/10 px-2.5 py-1 text-xs font-medium text-[#86EFAC]">
                  {onlineCount} Online
                </p>
              </div>

              <div className="mt-4 grid gap-3">
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
                          <p className="truncate text-sm font-medium text-zinc-100">{member.username}</p>
                          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getRoleBadgeClassName(member.role)}`}>
                            {member.role}
                          </span>
                        </div>
                        <p className="truncate text-xs text-zinc-500">{member.email}</p>
                      </div>
                      {canRemoveMember ? (
                        <button
                          type="button"
                          onClick={() => onRequestRemoveMember?.(member)}
                          disabled={removingMemberId === member.id}
                          className="grid size-8 shrink-0 place-items-center rounded-lg border border-red-300/15 text-red-200 transition hover:bg-red-950/30 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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
          </>
        )}

        {activeTab === 'editor' && (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Document Info</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Active collaborative document</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="grid size-8 place-items-center rounded-full border border-[#18D6A3]/20 bg-[#18D6A3]/10 text-[#18D6A3]">
                    <FileCode size={15} aria-hidden="true" />
                  </span>
                </div>
              </div>
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="text-zinc-500">File Name</dt>
                  <dd className="font-medium text-zinc-100 font-mono text-xs">main</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="text-zinc-500">Language</dt>
                  <dd className="font-medium text-zinc-100">Selected in editor</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="text-zinc-500">Storage</dt>
                  <dd className="font-medium text-zinc-100">Autosaved</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="text-zinc-500">Sync Status</dt>
                  <dd className="font-medium text-emerald-400">Connected</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Active Collaborators</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Editing this document</p>
                </div>
                <p className="rounded-full border border-[#18D6A3]/20 bg-[#18D6A3]/10 px-2.5 py-1 text-xs font-medium text-[#7FFFE0]">
                  {editorCollaboratorLabel}
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                {editorPresenceUsers.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center gap-3 rounded-xl border border-transparent p-1.5 transition hover:border-white/8 hover:bg-white/[0.035]">
                    <Avatar name={collaborator.username} seed={collaborator.username || collaborator.email} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{collaborator.username}</p>
                      <p className="text-xs text-zinc-500">Active in editor</p>
                    </div>
                    <span className="size-2 rounded-full bg-[#18D6A3] shadow-[0_0_12px_rgba(24,214,163,0.55)]" />
                  </div>
                ))}
                {!editorPresenceUsers.length ? (
                  <p className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-4 text-sm text-zinc-500">
                    No one is editing right now.
                  </p>
                ) : null}
              </div>
            </section>
          </>
        )}

        {activeTab === 'whiteboard' && (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Board Settings</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Canvas workspace configuration</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="grid size-8 place-items-center rounded-full border border-[#18D6A3]/20 bg-[#18D6A3]/10 text-[#18D6A3]">
                    <Grid size={15} aria-hidden="true" />
                  </span>
                </div>
              </div>
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="text-zinc-500">Zoom Level</dt>
                  <dd className="font-medium text-zinc-100">100%</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="text-zinc-500">Canvas Background</dt>
                  <dd className="font-medium text-zinc-100">Grid Overlay</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                  <dt className="text-zinc-500">Snap to Grid</dt>
                  <dd className="font-medium text-[#18D6A3]">Enabled</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
              <p className="text-sm font-semibold text-white">Board Status</p>
              <p className="mt-0.5 text-xs text-zinc-500">Liveblocks powers this room canvas.</p>
            </section>
          </>
        )}
      </div>
    </aside>
  )
}

