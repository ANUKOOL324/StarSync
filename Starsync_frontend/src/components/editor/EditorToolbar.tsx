import { Play, RotateCcw, Save } from 'lucide-react'

import type { EditorLanguage, SaveStatus } from '../../types/editor'
import { Button } from '../ui/Button'
import { LanguageSelect } from './LanguageSelect'

type EditorToolbarProps = {
  canRun: boolean
  disabled?: boolean
  language: EditorLanguage
  lastSavedAt: Date | null
  onClearOutput: () => void
  onLanguageChange: (language: EditorLanguage) => void
  onReset: () => void
  onRunCode: () => void
  onSave: () => void
  onSubmit: () => void
  saveStatus: SaveStatus
  toolbarMode: 'collaborative' | 'competing'
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
  canRun,
  disabled,
  language,
  lastSavedAt,
  onClearOutput,
  onLanguageChange,
  onReset,
  onRunCode,
  onSave,
  onSubmit,
  saveStatus,
  toolbarMode,
  isRunning,
}: EditorToolbarProps) {
  const isCompetingToolbar = toolbarMode === 'competing'

  if (isCompetingToolbar) {
    return (
      <div className="flex shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-white/10 bg-[#05080A]/78 px-2 py-2 backdrop-blur-xl sm:gap-3 sm:px-3 md:px-4">
        <LanguageSelect
          disabled={disabled}
          language={language}
          onChange={onLanguageChange}
          className="min-w-0 max-w-[9.5rem] shrink sm:max-w-none"
        />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onReset}
            aria-label="Reset code"
            title="Reset"
          >
            <RotateCcw size={15} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRunCode}
            disabled={disabled || isRunning || !canRun}
            aria-label={isRunning ? 'Running code' : 'Run code'}
            title={isRunning ? 'Running' : 'Run code'}
          >
            <Play size={15} aria-hidden="true" />
          </Button>
          <span className="inline-flex shrink-0 rounded-md bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-px shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition duration-150 hover:via-white/20">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-3 font-semibold !rounded-[5px] !border-0 !bg-[#18181B]/78 !text-[#18D6A3] backdrop-blur-2xl transition-all duration-150 hover:!bg-[#18D6A3]/08 hover:!text-[#18D6A3] active:scale-[0.97] active:!bg-[#18D6A3]/16 active:!text-[#35E0B4] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)] sm:h-9 sm:px-4"
              onClick={onSubmit}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-[#18D6A3]"
                aria-hidden="true"
              >
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m9 15 3-3 3 3" />
              </svg>
              Submit
            </Button>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-[#05080A]/78 px-3 py-3 backdrop-blur-xl sm:px-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-center min-w-0">
        <LanguageSelect disabled={disabled} language={language} onChange={onLanguageChange} />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="hidden sm:inline-block rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs text-slate-400">
          {getSaveStatusLabel(saveStatus, lastSavedAt)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onSave}
          disabled={disabled || saveStatus === 'saving'}
          aria-label="Save code"
          title="Save code"
        >
          <Save size={15} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClearOutput}
          aria-label="Clear code"
          title="Clear code"
        >
          <RotateCcw size={15} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onRunCode}
          disabled={disabled || isRunning || !canRun}
          className="!bg-[#05080a] hover:!bg-[#18D6A3]/08 !text-[#18D6A3] hover:!text-[#18D6A3] font-semibold border !border-[#18D6A3]/40 shadow-[0_0_12px_rgba(24,214,163,0.2)] hover:!border-[#18D6A3]/60 hover:shadow-[0_0_14px_rgba(24,214,163,0.35)] transition-all duration-200"
        >
          <Play size={15} aria-hidden="true" />
          {isRunning ? 'Running' : 'Run Code'}
        </Button>
      </div>
    </div>
  )
}
