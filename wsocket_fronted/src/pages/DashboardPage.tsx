import { motion } from 'framer-motion'
import { ArrowRight, Hash, LogOut, Plus, Radio, UserCircle } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '../components/chat/EmptyState'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { useRooms } from '../hooks/useRooms'

export function DashboardPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { createRoom, isLoadingRooms, joinRoom, roomError, rooms } = useRooms()
  const [modalMode, setModalMode] = useState<'create' | 'join' | null>(null)

  const handleRoomSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const value = String(formData.get('room') ?? '')
    const room = modalMode === 'join' ? await joinRoom(value) : await createRoom(value)

    if (room) {
      setModalMode(null)
      navigate(`/rooms/${room.id}`)
    }
  }

  return (
    <section className="neon-field min-h-dvh px-5 py-6 sm:px-8 lg:px-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-[#18181B] text-[#18D6A3] shadow-lg shadow-black/20 border border-white/10">
            <Radio size={19} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold   text-white">WS Chat</p>
            <p className="text-xs text-zinc-500">Realtime workspace</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} aria-hidden="true" />
          Logout
        </button>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-6rem)] max-w-6xl content-center gap-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <div className="mb-5 flex items-center gap-3 text-sm text-zinc-400">
            <UserCircle size={18} className="text-[#7FFFE0]" aria-hidden="true" />
            <span>Signed in as {user?.username}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Choose where the conversation starts.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            Create a focused room or join an existing one. The chat workspace opens only after a
            room is selected.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setModalMode('create')}
            className="rounded-lg border border-[#18D6A3]/20 bg-[#18181B]/70 p-5 text-left shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:border-[#18D6A3]/35 hover:bg-[#18D6A3]/10"
          >
            <div className="mb-5 grid size-11 place-items-center rounded-lg bg-[#18D6A3] text-[#03110E]">
              <Plus size={20} aria-hidden="true" />
            </div>
            <p className="text-lg font-semibold text-white">Create room</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Start a new realtime space for a topic, team, or quick discussion.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setModalMode('join')}
            className="rounded-lg border border-white/10 bg-black/28 p-5 text-left shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/7"
          >
            <div className="mb-5 grid size-11 place-items-center rounded-lg bg-white/8 text-[#7FFFE0]">
              <Hash size={20} aria-hidden="true" />
            </div>
            <p className="text-lg font-semibold text-white">Join room</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Enter a room slug and open the matching WebSocket channel.
            </p>
          </button>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Recent rooms</p>
            <p className="text-xs text-zinc-500">{rooms.length} saved</p>
          </div>
          {isLoadingRooms ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-lg bg-white/7" />
              ))}
            </div>
          ) : roomError ? (
            <div className="rounded-lg border border-red-300/20 bg-red-950/20 p-4 text-sm text-red-200">
              {roomError}
            </div>
          ) : rooms.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.slice(0, 6).map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/5 p-3 text-left transition hover:border-[#18D6A3]/25 hover:bg-white/8"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-[#111113] text-[#7FFFE0]">
                    <Hash size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {room.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">{room.slug}</span>
                  </span>
                  <ArrowRight size={16} className="text-zinc-500" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              variant="dashboard"
              title="No rooms yet"
              description="Create or join a room to open the realtime chat workspace."
            />
          )}
        </section>
      </div>

      <Modal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === 'join' ? 'Join room' : 'Create room'}
      >
        <form onSubmit={handleRoomSubmit} className="grid gap-4">
          <Input
            name="room"
            placeholder={modalMode === 'join' ? 'room-slug' : 'Room name'}
            autoFocus
          />
          <Button type="submit">{modalMode === 'join' ? 'Join room' : 'Create room'}</Button>
        </form>
      </Modal>
    </section>
  )
}

