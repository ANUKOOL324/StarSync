import { BookOpen, FileText, MessageSquare, ScrollText, Users } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import type { ProblemPanelTab, SessionPanelTab } from './competingTypes'

export const PROBLEM_PANEL_COLLAPSED_SIZE_PX = 56
export const PROBLEM_PANEL_EXPANDED_MIN_SIZE_PX = 220
const problemPanelRailItems = [
  { value: 'problem' as const, label: 'Problem', icon: FileText },
  { value: 'submissions' as const, label: 'Submissions', icon: ScrollText },
  { value: 'editorial' as const, label: 'Editorial', icon: BookOpen },
]

export const SESSION_PANEL_COLLAPSED_SIZE_PX = 56
export const SESSION_PANEL_EXPANDED_MIN_SIZE_PX = 280
const sessionPanelRailItems = [
  { value: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { value: 'players' as const, label: 'Players', icon: Users },
]

export function ProblemPanelRail({
  activeTab,
  onSelect,
}: {
  activeTab: ProblemPanelTab
  onSelect: (tab: ProblemPanelTab) => void
}) {
  return (
    <nav
      className="flex h-full w-full flex-col items-center bg-[#060A10]/95 py-2"
      aria-label="Problem panel sections"
    >
      {problemPanelRailItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.value

        return (
          <Tooltip key={item.value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelect(item.value)}
                aria-label={item.label}
                aria-pressed={isActive}
                className={[
                  'flex w-full cursor-pointer flex-col items-center gap-1.5 px-1 py-3 transition',
                  isActive
                    ? 'border-r-2 border-[#57F1DB] bg-[#57F1DB]/10 text-[#D6FFF6]'
                    : 'border-r-2 border-transparent text-slate-500 hover:bg-white/4 hover:text-slate-200',
                ].join(' ')}
              >
                <Icon size={17} aria-hidden="true" />
                <span className="text-[10px] font-medium leading-none tracking-wide [writing-mode:vertical-rl]">
                  {item.label}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}

export function SessionPanelRail({
  activeTab,
  onSelect,
}: {
  activeTab: SessionPanelTab
  onSelect: (tab: SessionPanelTab) => void
}) {
  return (
    <nav
      className="flex h-full w-full flex-col items-center bg-[#060A10]/95 py-2"
      aria-label="Session panel sections"
    >
      {sessionPanelRailItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.value

        return (
          <Tooltip key={item.value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelect(item.value)}
                aria-label={item.label}
                aria-pressed={isActive}
                className={[
                  'flex w-full cursor-pointer flex-col items-center gap-1.5 px-1 py-3 transition',
                  isActive
                    ? 'border-l-2 border-[#57F1DB] bg-[#57F1DB]/10 text-[#D6FFF6]'
                    : 'border-l-2 border-transparent text-slate-500 hover:bg-white/4 hover:text-slate-200',
                ].join(' ')}
              >
                <Icon size={17} aria-hidden="true" />
                <span className="text-[10px] font-medium leading-none tracking-wide [writing-mode:vertical-rl]">
                  {item.label}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">{item.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
