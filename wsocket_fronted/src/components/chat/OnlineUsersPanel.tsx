import { Activity, Clock, Radio } from 'lucide-react'

import type { ChatRoom, OnlineUser } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

type OnlineUsersPanelProps = {
  isOpen: boolean
  onlineUsers: OnlineUser[]
  room: ChatRoom
}

export function OnlineUsersPanel({ isOpen, onlineUsers, room }: OnlineUsersPanelProps) {
  return (
    <aside
      className={[
        'border-l border-white/8 bg-black/26 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl xl:block xl:w-64',
        isOpen ? 'block' : 'hidden',
      ].join(' ')}
    >
      <div className="rounded-lg border border-white/8 bg-white/4 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Radio size={16} className="text-teal-300" aria-hidden="true" />
          Room details
        </div>
        <p className="mt-2 text-xs leading-5 text-zinc-400">{room.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-black/24 p-2.5">
            <Activity className="mb-2 text-teal-200" size={16} aria-hidden="true" />
            <p className="text-xs text-zinc-500">Status</p>
            <p className="text-sm font-semibold text-white">Active</p>
          </div>
          <div className="rounded-lg bg-black/24 p-2.5">
            <Clock className="mb-2 text-teal-200" size={16} aria-hidden="true" />
            <p className="text-xs text-zinc-500">Latency</p>
            <p className="text-sm font-semibold text-white">Realtime</p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-white/8 bg-white/4 p-3">
        <p className="text-sm font-semibold text-white">Online users</p>
        <div className="mt-4 grid gap-3">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <Avatar name={user.name} tone="dark" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{user.name}</p>
                <p className="text-xs capitalize text-zinc-500">{user.status}</p>
              </div>
              <span
                className={[
                  'size-2 rounded-full',
                  user.status === 'online' ? 'bg-teal-300' : 'bg-amber-300',
                ].join(' ')}
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
