import { Play, RotateCcw, Save } from 'lucide-react'

import type { EditorLanguage, EditorPresenceUser, SaveStatus } from '../../types/editor'
import { Avatar } from '../ui/Avatar'
import { LanguageSelect } from './LanguageSelect'

type EditorToolbarProps = {
  activeCollaborators: EditorPresenceUser[]
  canRun: boolean
  disabled?: boolean
  documentTitle: string
  language: EditorLanguage
  lastSavedAt: Date | null
  onClearOutput: () => void
  onLanguageChange: (language: EditorLanguage) => void
  onRunCode: () => void
  onSave: () => void
  roomLabel: string
  saveStatus: SaveStatus
  isRunning: boolean
}

const getSaveStatusLabel = (saveStatus: SaveStatus, lastSavedAt: Date | null) => {
  if (saveStatus === 'syncing') return 'Syncing...'
  if (saveStatus === 'saving') return 'Saving...'
  if (saveStatus === 'unsaved') return 'Unsaved'
  if (saveStatus === 'error') return 'Save failed'
  if (saveStatus === 'remote') return 'Synced'
  if (saveStatus === 'saved' && lastSavedAt) {
    return `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  return 'Ready'
}

export function EditorToolbar({
  activeCollaborators,
  canRun,
  disabled,
  documentTitle,
  language,
  lastSavedAt,
  onClearOutput,
  onLanguageChange,
  onRunCode,
  onSave,
  roomLabel,
  saveStatus,
  isRunning,
}: EditorToolbarProps) {
  const visibleCollaborators = activeCollaborators.slice(0, 3)
  const hiddenCollaboratorCount = Math.max(activeCollaborators.length - visibleCollaborators.length, 0)
  const collaboratorLabel = activeCollaborators.length === 1 ? '1 active' : `${activeCollaborators.length} active`

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-[#05080A]/78 px-3 py-3 backdrop-blur-xl sm:px-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-100">{documentTitle}</p>
          <span className="rounded-full border border-[#18D6A3]/20 bg-[#18D6A3]/10 px-2 py-0.5 text-[11px] font-medium text-[#7FFFE0]">
            main
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">{roomLabel}</p>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div
          className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-2.5"
          title={`${activeCollaborators.length} active editor collaborator${activeCollaborators.length === 1 ? '' : 's'}`}
        >
          <div className="flex -space-x-2">
            {visibleCollaborators.map((collaborator) => (
              <Avatar
                key={collaborator.id}
                name={collaborator.username}
                seed={collaborator.username || collaborator.email}
                size="xs"
              />
            ))}
            {hiddenCollaboratorCount > 0 ? (
              <span className="grid size-7 place-items-center rounded-full border border-white/10 bg-[#18181B] text-[10px] font-semibold text-slate-300">
                +{hiddenCollaboratorCount}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-slate-400">{collaboratorLabel}</span>
        </div>
        <LanguageSelect disabled={disabled} language={language} onChange={onLanguageChange} />
        <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs text-slate-400">
          {getSaveStatusLabel(saveStatus, lastSavedAt)}
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={disabled || saveStatus === 'saving'}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm font-medium text-slate-200 transition hover:border-[#18D6A3]/30 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={15} aria-hidden="true" />
          Save
        </button>
        <button
          type="button"
          onClick={onClearOutput}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-100"
        >
          <RotateCcw size={15} aria-hidden="true" />
          Clear
        </button>
        <button
          type="button"
          onClick={onRunCode}
          disabled={disabled || isRunning || !canRun}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#18D6A3]/25 bg-[#18D6A3] px-4 text-sm font-semibold text-[#03110E] shadow-lg shadow-[#18D6A3]/15 transition hover:bg-[#35E0B4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Play size={15} aria-hidden="true" />
          {isRunning ? 'Running' : 'Run Code'}
        </button>
      </div>
    </div>
  )
}
