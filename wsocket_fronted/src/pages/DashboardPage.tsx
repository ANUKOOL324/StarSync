import {
  ArrowRight,
  Hash,
  LogOut,
  Plus,
  Home,
  LayoutGrid,
  Menu,
  Search,
  X,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '../components/chat/EmptyState'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../hooks/useAuth'
import { useRooms } from '../hooks/useRooms'

export function DashboardPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { createRoom, isLoadingRooms, joinRoom, roomError, rooms } = useRooms()
  const [modalMode, setModalMode] = useState<'create' | 'join' | null>(null)
  const [useMemberLimit, setUseMemberLimit] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'home' | 'rooms'>('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const closeModal = () => {
    setModalMode(null)
    setUseMemberLimit(false)
    setFormError(null)
  }

  const handleRoomSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const formData = new FormData(event.currentTarget)

    try {
      if (modalMode === 'join') {
        const joinCode = String(formData.get('joinCode') ?? '')
        const room = await joinRoom(joinCode)

        closeModal()
        navigate(`/rooms/${room.id}`)
        return
      }

      const roomName = String(formData.get('roomName') ?? '')
      const maxMembersValue = Number(formData.get('maxMembers') ?? 0)
      const room = await createRoom({
        name: roomName,
        unlimitedMembers: !useMemberLimit,
        maxMembers: useMemberLimit ? maxMembersValue : null,
      })

      closeModal()
      navigate(`/rooms/${room.id}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    }
  }

  // Stats: computed from full rooms list, not affected by search
  const createdRoomsCount = rooms.filter((room) => room.adminId === user?.id).length
  const joinedRoomsCount = rooms.filter((room) => room.adminId !== user?.id).length

  const filteredRooms = rooms.filter((room) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    const name = room.name.toLowerCase()
    const code = (room.joinCode ?? '').toLowerCase()
    return name.includes(query) || code.includes(query)
  })

  return (
    <section className="neon-field min-h-dvh flex">
      {/* Mobile Sidebar overlay backdrop */}
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden border-none cursor-default"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar backdrop"
        />
      )}

      {/* Left Sidebar Layout */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0B0C0E]/70 border-r border-white/5 p-5 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Sidebar Logo / Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <img
              src="/starsync-logo.png"
              alt="StarSync logo"
              className="h-9 w-9 rounded-full object-cover border border-white/10"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-wider text-white uppercase truncate">StarSync</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden focus:outline-none"
            aria-label="Close sidebar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-6 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('home')
              setIsSidebarOpen(false)
            }}
            className={[
              'flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition duration-150 focus:outline-none',
              activeTab === 'home'
                ? 'bg-white/[0.05] text-[#D6FFF6] border-r-2 border-[#57F1DB]'
                : 'text-slate-400 hover:bg-white/[0.03] hover:text-white',
            ].join(' ')}
          >
            <Home size={16} aria-hidden="true" />
            <span>Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('rooms')
              setIsSidebarOpen(false)
            }}
            className={[
              'flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition duration-150 focus:outline-none',
              activeTab === 'rooms'
                ? 'bg-white/[0.05] text-[#D6FFF6] border-r-2 border-[#57F1DB]'
                : 'text-slate-400 hover:bg-white/[0.03] hover:text-white',
            ].join(' ')}
          >
            <LayoutGrid size={16} aria-hidden="true" />
            <span>Rooms</span>
          </button>
        </nav>

        {/* Sidebar Bottom Footer Profile Area */}
        <div className="border-t border-white/5 pt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 shadow-lg shadow-black/20 backdrop-blur-xl">
            <Avatar name={user?.username ?? 'User'} seed={user?.username ?? user?.email ?? 'user'} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">{user?.username}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-xs font-semibold text-zinc-300 hover:border-[#18D6A3]/30 hover:bg-[#18D6A3]/5 hover:text-white transition focus:outline-none"
          >
            <LogOut size={14} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl">
          <div className="flex items-center gap-4 w-full">
            {/* Hamburger menu on Mobile */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white lg:hidden focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu size={18} aria-hidden="true" />
            </button>

            {/* Title (only when in Workspace tab) */}
            {activeTab === 'home' && (
              <span className="text-xs font-semibold tracking-widest bg-gradient-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-transparent uppercase font-mono select-none">
                realtime workspace
              </span>
            )}
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 p-6 sm:p-8 space-y-10 max-w-container-max w-full mx-auto">
          {activeTab === 'home' ? (
            /* Home View */
            <div className="space-y-6">
              {/* Action Cards Grid */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 w-full">
                {/* Join Room */}
                <div
                  onClick={() => {
                    setFormError(null)
                    setModalMode('join')
                  }}
                  className="group rounded-xl bg-gradient-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-full rounded-[10px] bg-[#18181B]/80 p-4 backdrop-blur-2xl transition duration-300 group-hover:bg-[#1F1F23]/85 flex flex-col justify-between cursor-pointer text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-20 w-20 bg-radial-gradient(circle_at_top_right,rgba(127,255,224,0.08),transparent_70%) pointer-events-none" />
                    <div>
                      <div className="mb-3.5 grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-gradient-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#F7F7F8] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition duration-300 group-hover:scale-110">
                        <Hash size={18} aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-medium tracking-[-0.02em] text-[#E5E1E4]">Join Room</h3>
                      <p className="mt-1.5 text-xs leading-5 text-[#BACAC5]">
                        Access a workspace with a room code.
                      </p>
                    </div>
                    <div className="mt-4 flex justify-start">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#D6FFF6] transition duration-200 group-hover:bg-white group-hover:text-[#03110E] group-hover:border-transparent">
                        <span>Enter Code</span>
                        <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Create Room */}
                <div
                  onClick={() => {
                    setFormError(null)
                    setModalMode('create')
                  }}
                  className="group rounded-xl bg-gradient-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-full rounded-[10px] bg-[#18181B]/80 p-4 backdrop-blur-2xl transition duration-300 group-hover:bg-[#1F1F23]/85 flex flex-col justify-between cursor-pointer text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-20 w-20 bg-radial-gradient(circle_at_top_right,rgba(24,214,163,0.08),transparent_70%) pointer-events-none" />
                    <div>
                      <div className="mb-3.5 grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-gradient-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#F7F7F8] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition duration-300 group-hover:scale-110">
                        <Plus size={18} aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-medium tracking-[-0.02em] text-[#E5E1E4]">Create Room</h3>
                      <p className="mt-1.5 text-xs leading-5 text-[#BACAC5]">
                        Start a private room and invite your team.
                      </p>
                    </div>
                    <div className="mt-4 flex justify-start">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#D6FFF6] transition duration-200 group-hover:bg-white group-hover:text-[#03110E] group-hover:border-transparent">
                        <span>Start Workspace</span>
                        <Plus size={12} className="transition-transform group-hover:scale-110" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Integrated Editor */}
                <div className="rounded-xl bg-gradient-to-b from-[#5A5A5C]/40 via-white/10 to-[#28282A]/45 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.11)] opacity-50">
                  <div className="h-full rounded-[10px] bg-[#18181B]/40 p-4 backdrop-blur-2xl flex flex-col justify-between text-left">
                    <div>
                      <div className="mb-3.5 grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-500">
                        <LayoutGrid size={18} className="opacity-50" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-medium tracking-[-0.02em] text-[#E5E1E4] opacity-80">Integrated Editor</h3>
                      <p className="mt-1.5 text-xs leading-5 text-[#BACAC5]/70">
                        Start collaborative Monaco editing sessions.
                      </p>
                    </div>
                    <div className="mt-4 flex justify-start">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.02] border border-white/5 px-2.5 py-1 text-[9px] font-medium text-slate-500 font-mono uppercase tracking-wider">
                        <span>Guide State</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Infinite Whiteboard */}
                <div className="rounded-xl bg-gradient-to-b from-[#5A5A5C]/40 via-white/10 to-[#28282A]/45 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.11)] opacity-50">
                  <div className="h-full rounded-[10px] bg-[#18181B]/40 p-4 backdrop-blur-2xl flex flex-col justify-between text-left">
                    <div>
                      <div className="mb-3.5 grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-500">
                        <Users size={18} className="opacity-50" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-medium tracking-[-0.02em] text-[#E5E1E4] opacity-80">Infinite Whiteboard</h3>
                      <p className="mt-1.5 text-xs leading-5 text-[#BACAC5]/70">
                        Sketch architecture and plans in real time.
                      </p>
                    </div>
                    <div className="mt-4 flex justify-start">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.02] border border-white/5 px-2.5 py-1 text-[9px] font-medium text-slate-500 font-mono uppercase tracking-wider">
                        <span>Guide State</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Rooms View */
            <div className="space-y-6">
              {/* Page Header: Title + Subtitle + Stats Badges */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Rooms</h1>
                  <p className="text-sm text-slate-400 mt-1">Manage and access your collaborative workspaces.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.07] px-3 py-1.5 font-mono text-xs">
                    <span className="text-slate-500">Created</span>
                    <span className="font-bold text-[#D6FFF6]">{createdRoomsCount}</span>
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.07] px-3 py-1.5 font-mono text-xs">
                    <span className="text-slate-500">Joined</span>
                    <span className="font-bold text-[#D6FFF6]">{joinedRoomsCount}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Search Input */}
              <div className="relative max-w-sm">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or code..."
                  className="h-9 w-full rounded-xl bg-white/[0.03] border border-white/[0.07] pl-9 pr-4 text-sm text-[#E5E1E4] placeholder-slate-600 outline-none focus:border-[#57F1DB]/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#57F1DB]/10 transition"
                />
              </div>

              {/* Room Grid */}
              <div className="space-y-4">
                {isLoadingRooms ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-24 animate-pulse rounded-xl bg-white/5 border border-white/5" />
                    ))}
                  </div>
                ) : roomError ? (
                  <div className="rounded-xl border border-red-300/20 bg-red-950/20 p-4 text-sm text-red-200">
                    {roomError}
                  </div>
                ) : filteredRooms.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredRooms.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => navigate(`/rooms/${room.id}`)}
                        className="group rounded-xl bg-gradient-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                      >
                        <div className="h-full rounded-[10px] bg-[#18181B]/80 p-4 backdrop-blur-2xl transition duration-300 group-hover:bg-[#1F1F23]/85 flex items-center gap-4 text-left relative overflow-hidden">
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/15 bg-gradient-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#F7F7F8] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition duration-300 group-hover:scale-105">
                            <Hash size={18} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-[#E5E1E4] group-hover:text-white transition-colors">
                              {room.name}
                            </span>
                            <span className="block truncate text-xs text-[#BACAC5] mt-0.5">
                              {room._count?.members ?? 0} / {room.maxMembers ?? 'Unlimited'} members
                            </span>
                            {room.joinCode ? (
                              <span className="inline-flex mt-1.5 items-center rounded bg-white/[0.04] border border-white/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-zinc-400">
                                {room.joinCode}
                              </span>
                            ) : null}
                          </span>
                          <ArrowRight size={16} className="text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-[#D6FFF6]" aria-hidden="true" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    variant="dashboard"
                    title="No rooms yet"
                    description={
                      searchQuery
                        ? 'No matching rooms found.'
                        : 'Create a room or join one with a room code to start collaborating.'
                    }
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Creation and Join Modals */}
      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'join' ? 'Join room' : 'Create room'}
      >
        <form onSubmit={handleRoomSubmit} className="grid gap-4">
          {modalMode === 'join' ? (
            <label className="grid gap-2 text-sm text-zinc-300">
              Room code
              <Input name="joinCode" placeholder="RM-7XPA2" autoFocus />
              <span className="text-xs text-zinc-500">Ask the room admin for the room code.</span>
            </label>
          ) : (
            <>
              <label className="grid gap-2 text-sm text-zinc-300">
                Room name
                <Input name="roomName" placeholder="DSA Study Group" autoFocus />
              </label>

              <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <p className="text-sm font-medium text-white">Member limit</p>
                <label className="flex items-start gap-3 text-sm text-zinc-300">
                  <input
                    type="radio"
                    name="memberLimitMode"
                    checked={!useMemberLimit}
                    onChange={() => setUseMemberLimit(false)}
                    className="mt-1"
                  />
                  <span>
                    Unlimited
                    <span className="block text-xs text-zinc-500">Anyone with the room code can join.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-zinc-300">
                  <input
                    type="radio"
                    name="memberLimitMode"
                    checked={useMemberLimit}
                    onChange={() => setUseMemberLimit(true)}
                    className="mt-1"
                  />
                  <span className="grid flex-1 gap-2">
                    Limit members
                    <Input
                      name="maxMembers"
                      type="number"
                      min="2"
                      defaultValue="10"
                      disabled={!useMemberLimit}
                    />
                    <span className="text-xs text-zinc-500">Includes you as admin.</span>
                  </span>
                </label>
              </div>
            </>
          )}

          {formError ? (
            <p className="rounded-lg border border-red-300/20 bg-red-950/20 p-3 text-sm text-red-200">
              {formError}
            </p>
          ) : null}

          <Button type="submit">{modalMode === 'join' ? 'Join room' : 'Create room'}</Button>
        </form>
      </Modal>
    </section>
  )
}



