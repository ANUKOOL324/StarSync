import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import type { CreateRoomPayload } from '../../services/roomService'
import type { ChatRoom } from '../../types/chat'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ScrollArea } from '../ui/scroll-area'
import { topicOptions } from './dashboardData'
import type { CreationStage, RoomDifficulty, RoomPurpose } from './dashboardTypes'
import { FloatingErrorNotification } from './FloatingErrorNotification'

type CreateRoomDialogProps = {
  initialRoomName: string
  isOpen: boolean
  onClose: () => void
  onCreate: (payload: CreateRoomPayload) => Promise<ChatRoom>
  onCreated: (room: ChatRoom) => void
  purpose: RoomPurpose
}

export function CreateRoomDialog({ initialRoomName, isOpen, onClose, onCreate, onCreated, purpose }: CreateRoomDialogProps) {
  const [useMemberLimit, setUseMemberLimit] = useState(false)
  const [creationStage, setCreationStage] = useState<CreationStage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<RoomDifficulty>('MEDIUM')
  const [selectedTopics, setSelectedTopics] = useState<string[]>(purpose === 'COMPETING' ? ['Array'] : [])
  const [topicSearchQuery, setTopicSearchQuery] = useState('')


  useEffect(() => {
    if (!error) return undefined
    const timeoutId = window.setTimeout(() => setError(null), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [error])

  const filteredTopicOptions = useMemo(() => {
    const query = topicSearchQuery.trim().toLowerCase()
    return topicOptions.filter((topic) => !query || topic.toLowerCase().includes(query))
  }, [topicSearchQuery])

  const toggleTopic = (topic: string) => {
    setSelectedTopics((current) => current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic])
  }

  const removeTopic = (topic: string) => {
    setSelectedTopics((current) => current.filter((item) => item !== topic))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setCreationStage('creating')
    const formData = new FormData(event.currentTarget)
    const roomName = String(formData.get('roomName') ?? '').trim()
    const maxMembersValue = Number(formData.get('maxMembers') ?? 0)

    if (!roomName) {
      setCreationStage('idle')
      setError('Add a room name.')
      return
    }
    if (useMemberLimit && (!Number.isFinite(maxMembersValue) || maxMembersValue < 2)) {
      setCreationStage('idle')
      setError('Use at least 2 members.')
      return
    }
    if (purpose === 'COMPETING' && selectedTopics.length === 0) {
      setCreationStage('idle')
      setError('Select at least one topic.')
      return
    }

    try {
      const [room] = await Promise.all([
        onCreate({
          name: roomName,
          unlimitedMembers: !useMemberLimit,
          maxMembers: useMemberLimit ? maxMembersValue : null,
          purpose,
          difficulty: purpose === 'COMPETING' ? selectedDifficulty : undefined,
          topics: purpose === 'COMPETING' ? selectedTopics : undefined,
          durationMinutes: purpose === 'COMPETING' ? 15 : undefined,
        }),
        new Promise((resolve) => setTimeout(resolve, 850)),
      ])
      setCreationStage('success')
      await new Promise((resolve) => setTimeout(resolve, 1600))
      onClose()
      onCreated(room)
    } catch {
      setCreationStage('idle')
      setError('Check the room details and try again.')
    }
  }

  const title = purpose === 'COMPETING' ? 'Create Competing Room' : 'Create Collaboration Room'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" hideHeader className="rounded-[28px] border border-white/10 bg-black/50 p-5 shadow-[0_26px_80px_rgba(0,0,0,0.58)]">
      <FloatingErrorNotification message={error} />
      <div className="rounded-[20px] border border-white/16 bg-linear-to-b from-[#303033]/95 via-[#242426]/95 to-[#202022]/95 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_55px_rgba(0,0,0,0.32)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="dashboard-dialog-title">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 cursor-pointer place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white" aria-label="Close modal">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="dashboard-dialog-label grid gap-2">
            Room name
            <Input name="roomName" placeholder="DSA Study Group" defaultValue={initialRoomName} autoFocus className="dashboard-dialog-input h-11 rounded-xl border-white/18 bg-[#161618]/70 px-4 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-white/45 focus-visible:ring-white/12" />
          </label>

          {purpose === 'COMPETING' ? (
            <div className="grid gap-4 rounded-2xl border border-white/14 bg-[#171719]/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="grid gap-2">
                <p className="dashboard-dialog-section-title">Difficulty</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['EASY', 'MEDIUM', 'HARD'] as const).map((difficulty) => {
                    const activeColorClass = difficulty === 'EASY'
                      ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300'
                      : difficulty === 'MEDIUM'
                        ? 'border-amber-500/40 bg-amber-500/12 text-amber-300'
                        : 'border-rose-500/40 bg-rose-500/12 text-rose-300'
                    return (
                      <button key={difficulty} type="button" onClick={() => setSelectedDifficulty(difficulty)} className={[
                        'dashboard-action-label-sm cursor-pointer rounded-lg border px-3 py-2 transition',
                        selectedDifficulty === difficulty ? activeColorClass : 'border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-white',
                      ].join(' ')}>
                        {difficulty[0] + difficulty.slice(1).toLowerCase()}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <p className="dashboard-dialog-section-title">Topics</p>
                <div className="dashboard-dialog-input flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-white/14 bg-[#111113]/70 px-3 py-2 text-sm text-white">
                  <span className="flex max-h-9 min-w-0 flex-1 flex-wrap items-center gap-2 overflow-y-auto pr-1">
                    {selectedTopics.length ? selectedTopics.map((topic) => (
                      <Badge key={topic} className="gap-1 rounded-full border-[#57F1DB]/30 bg-[#57F1DB]/12 px-2.5 py-1 text-xs text-[#D6FFF6]">
                        {topic}
                        <button
                          type="button"
                          aria-label={`Remove ${topic}`}
                          className="cursor-pointer rounded-full text-[#A7B8B3] transition hover:text-white"
                          onClick={() => removeTopic(topic)}
                        >
                          <X size={12} aria-hidden="true" />
                        </button>
                      </Badge>
                    )) : <span className="text-zinc-500">Select topics...</span>}
                  </span>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Open topics menu"
                        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-zinc-500 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57F1DB]/35"
                      >
                        <ChevronDown size={16} aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[80] w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border-white/14 bg-[#0D0E10]/98 p-0 text-white shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                        <Search size={15} className="text-zinc-500" aria-hidden="true" />
                        <input value={topicSearchQuery} onChange={(event) => setTopicSearchQuery(event.target.value)} onKeyDown={(event) => event.stopPropagation()} placeholder="Search topics..." className="dashboard-dialog-input h-8 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" />
                      </div>
                      <ScrollArea className="h-36">
                        <div className="p-1">
                          {filteredTopicOptions.length ? filteredTopicOptions.map((topic) => (
                            <DropdownMenuItem key={topic} onSelect={(event) => {
                              event.preventDefault()
                              toggleTopic(topic)
                            }} className="dashboard-dialog-label flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 focus:bg-[#57F1DB]/10 focus:text-[#D6FFF6]">
                              <span>{topic}</span>
                              {selectedTopics.includes(topic) ? <Check size={15} className="text-[#57F1DB]" aria-hidden="true" /> : null}
                            </DropdownMenuItem>
                          )) : <p className="px-3 py-3 text-sm text-zinc-500">No topics found.</p>}
                        </div>
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2.5 rounded-2xl border border-white/14 bg-[#171719]/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="dashboard-dialog-section-title">Member limit</p>
            <label className="dashboard-dialog-label flex cursor-pointer select-none items-start gap-3">
              <input type="radio" name="memberLimitMode" checked={!useMemberLimit} onChange={() => setUseMemberLimit(false)} className="dashboard-dialog-radio" />
              <span>Unlimited</span>
            </label>
            <label className="dashboard-dialog-label flex cursor-pointer select-none items-start gap-3">
              <input type="radio" name="memberLimitMode" checked={useMemberLimit} onChange={() => setUseMemberLimit(true)} className="dashboard-dialog-radio" />
              <span className="grid flex-1 gap-1.5">
                Limit members
                <Input name="maxMembers" type="number" min="2" defaultValue="10" disabled={!useMemberLimit} className="dashboard-dialog-input h-10 rounded-xl border-white/18 bg-[#161618]/70 px-4 text-zinc-100 disabled:opacity-45" />
              </span>
            </label>
          </div>

          <Button type="submit" disabled={creationStage !== 'idle'} className="landing-nav-button mx-auto h-11 min-w-36 cursor-pointer rounded-full border-2 border-white/10 bg-transparent px-7 text-base text-white shadow-none transition-all duration-300 hover:border-white/22 hover:bg-white/8 hover:text-white focus-visible:border-white/35 focus-visible:ring-white/12 disabled:cursor-not-allowed">
            {creationStage === 'creating' ? (
              <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />Creating Room...</span>
            ) : creationStage === 'success' ? (
              <span className="flex animate-bounce items-center justify-center gap-2"><Check className="h-4 w-4" aria-hidden="true" />Room created! {purpose === 'COMPETING' ? "Let's compete!" : "Let's collab!"}</span>
            ) : 'Create Room'}
          </Button>
        </form>
      </div>
    </Modal>
  )
}
