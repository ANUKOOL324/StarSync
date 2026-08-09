import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import type { ChatRoom } from '../../types/chat'

import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { FloatingErrorNotification } from './FloatingErrorNotification'

type JoinRoomDialogProps = {
  isOpen: boolean
  onClose: () => void
  onJoin: (roomCode: string) => Promise<ChatRoom>
  onJoined: (room: ChatRoom) => void
}

export function JoinRoomDialog({ isOpen, onClose, onJoin, onJoined }: JoinRoomDialogProps) {
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (!error) return undefined
    const timeoutId = window.setTimeout(() => setError(null), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [error])

  const closeDialog = () => {
    setRoomCode('')
    setError(null)
    setIsJoining(false)
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const trimmedRoomCode = roomCode.trim()

    if (!trimmedRoomCode) {
      setError('Enter a room code first.')
      return
    }

    try {
      setIsJoining(true)
      const room = await onJoin(trimmedRoomCode)
      closeDialog()
      onJoined(room)
    } catch {
      setError('Check the room code and try again.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDialog}
      title="Join Room"
      size="lg"
      hideHeader
      className="relative overflow-visible rounded-[28px] border border-white/10 bg-black/50 p-5 shadow-[0_26px_80px_rgba(0,0,0,0.58)]"
    >
      <FloatingErrorNotification message={error} />
      <div className="rounded-[20px] border border-white/16 bg-linear-to-b from-[#303033]/95 via-[#242426]/95 to-[#202022]/95 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_55px_rgba(0,0,0,0.32)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="dashboard-dialog-title">Join Room</h2>
          <button type="button" onClick={closeDialog} className="grid size-9 cursor-pointer place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white" aria-label="Close modal">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mx-auto grid max-w-[21rem] justify-items-center gap-4 text-center">
          <label className="dashboard-dialog-label grid w-full justify-items-center">
            <div className="w-full rounded-xl border border-white/18 bg-[#2B2B2E]/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span className="dashboard-kicker block">Room Code</span>
              <Input
                value={roomCode}
                onChange={(event) => {
                  setRoomCode(event.target.value.toUpperCase())
                  setError(null)
                }}
                placeholder="RM-ABC123"
                autoFocus
                className="dashboard-dialog-input mt-2 h-8 border-0 bg-transparent p-0 text-center text-lg tracking-[0.12em] text-[#D6FFF6] shadow-none placeholder:text-zinc-500 focus-visible:border-0 focus-visible:ring-0"
              />
            </div>
          </label>
          <Button type="submit" disabled={isJoining} variant="ghost" className="landing-nav-button h-11 rounded-full border-2 border-white/10 bg-transparent px-7 text-base text-white shadow-[0_10px_28px_rgba(0,0,0,0.22)] hover:border-white/22 hover:bg-white/8 hover:text-white">
            {isJoining ? 'Joining...' : 'Enter Code'}
          </Button>
        </form>
      </div>
    </Modal>
  )
}
