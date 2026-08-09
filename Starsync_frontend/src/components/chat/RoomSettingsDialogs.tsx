import { LogOut, Trash2, X } from 'lucide-react'
import type { FormEvent } from 'react'

import type { ChatRoom } from '../../types/chat'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'

type RoomSettingsDialogsProps = {
  isAdmin: boolean
  isDeleteConfirmOpen: boolean
  isSettingsOpen: boolean
  onCancelDelete: () => void
  onCloseDelete: () => void
  onCloseSettings: () => void
  onDelete: () => void
  onLeave: () => void
  onOpenDelete: () => void
  onRename: (event: FormEvent<HTMLFormElement>) => void
  room: ChatRoom
  roomActionError: string | null
}

export function RoomSettingsDialogs({
  isAdmin,
  isDeleteConfirmOpen,
  isSettingsOpen,
  onCancelDelete,
  onCloseDelete,
  onCloseSettings,
  onDelete,
  onLeave,
  onOpenDelete,
  onRename,
  room,
  roomActionError,
}: RoomSettingsDialogsProps) {
  return (
    <>
      <Modal isOpen={isSettingsOpen} onClose={onCloseSettings} title="Room settings" size="lg" hideHeader className="relative overflow-visible rounded-[28px] border border-white/10 bg-black/50 p-5 shadow-[0_26px_80px_rgba(0,0,0,0.58)]">
        <div className="rounded-[20px] border border-white/16 bg-linear-to-b from-[#303033]/95 via-[#242426]/95 to-[#202022]/95 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_55px_rgba(0,0,0,0.32)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="room-font-display text-xl font-bold tracking-tight text-[#F4F4F5]">Room settings</h2>
            <button type="button" onClick={onCloseSettings} className="grid size-9 cursor-pointer place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white" aria-label="Close modal">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-5">
            {isAdmin ? (
              <form onSubmit={onRename} className="grid gap-3">
                <label className="room-font-body grid gap-2 text-sm text-zinc-300">
                  Rename room
                  <Input name="name" defaultValue={room.name} placeholder="Room name" className="room-font-body" />
                </label>
                <Button type="submit" size="sm" className="room-font-display h-10 w-fit cursor-pointer justify-self-end rounded-full border-2 border-white/10 bg-transparent px-5 text-sm font-semibold text-white shadow-none transition-all duration-300 hover:border-white/22 hover:bg-white/8 hover:text-white">
                  Save name
                </Button>
              </form>
            ) : (
              <p className="room-font-body rounded-lg border border-white/8 bg-white/4 p-3 text-sm text-zinc-400">
                {room.type === 'DM' ? 'Direct messages do not use group admin settings.' : 'Only the active room admin can rename or delete this room.'}
              </p>
            )}

            {roomActionError ? <p className="rounded-lg border border-red-300/20 bg-red-950/20 p-3 text-sm text-red-200">{roomActionError}</p> : null}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onLeave} className="room-font-display h-10 cursor-pointer rounded-full border-2 border-white/10 bg-transparent px-5 text-sm font-semibold text-white shadow-none transition-all duration-300 hover:border-white/22 hover:bg-white/8 hover:text-white">
                <LogOut size={14} aria-hidden="true" />
                Back to dashboard
              </Button>
              {isAdmin ? (
                <Button type="button" variant="ghost" size="sm" onClick={onOpenDelete} className="room-font-display h-10 cursor-pointer rounded-full border-2 border-red-500/15 bg-transparent px-5 text-sm font-semibold text-red-400 shadow-none transition-all duration-300 hover:border-red-500/30 hover:bg-red-950/10 hover:text-red-300">
                  <Trash2 size={14} aria-hidden="true" />
                  Delete room
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteConfirmOpen} onClose={onCloseDelete} title="Delete room" size="lg" hideHeader className="relative overflow-visible rounded-[28px] border border-white/10 bg-black/50 p-5 shadow-[0_26px_80px_rgba(0,0,0,0.58)]">
        <div className="rounded-[20px] border border-white/16 bg-linear-to-b from-[#303033]/95 via-[#242426]/95 to-[#202022]/95 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_55px_rgba(0,0,0,0.32)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="room-font-display text-xl font-bold tracking-tight text-[#F4F4F5]">Delete room</h2>
            <button type="button" onClick={onCloseDelete} className="grid size-9 cursor-pointer place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white" aria-label="Close modal">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-5">
            <p className="room-font-body text-center text-sm leading-6 text-zinc-300">Are you sure you want to delete this room?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="ghost" onClick={onCancelDelete} className="room-font-display h-10 cursor-pointer rounded-full border-2 border-white/10 bg-transparent px-5 text-sm font-semibold text-white shadow-none transition-all duration-300 hover:border-white/22 hover:bg-white/8 hover:text-white">Cancel</Button>
              <Button type="button" variant="ghost" onClick={onDelete} className="room-font-display h-10 cursor-pointer rounded-full border-2 border-red-500/15 bg-transparent px-5 text-sm font-semibold text-red-400 shadow-none transition-all duration-300 hover:border-red-500/30 hover:bg-red-950/10 hover:text-red-300">
                <Trash2 size={14} aria-hidden="true" />
                Delete room
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
