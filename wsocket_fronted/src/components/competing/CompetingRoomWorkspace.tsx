import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  LogOut,
  MoreVertical,
  MessageSquare,
  Play,
  RotateCcw,
  ScrollText,
  StopCircle,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import type { PanelImperativeHandle } from 'react-resizable-panels'

import { useAuth } from '../../hooks/useAuth'
import { useChatSocket } from '../../hooks/useChatSocket'
import { roomMemberService } from '../../services/roomMemberService'
import { roomService } from '../../services/roomService'
import { editorService } from '../../services/editorService'
import type { AssignedRoomProblem, ChatRoom, RoomMember } from '../../types/chat'
import type { SubmissionHistoryItem } from '../../types/editor'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { MessageInput } from '../chat/MessageInput'
import { MessageList } from '../chat/MessageList'
import { TypingIndicator } from '../chat/TypingIndicator'
import { EditorSkeleton } from '../editor/EditorSkeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/Input'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../ui/resizable'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'

const LazyCodeEditorWorkspace = lazy(() =>
  import('../editor/CodeEditorWorkspace').then((module) => ({
    default: module.CodeEditorWorkspace,
  })),
)

type CompetingRoomWorkspaceProps = {
  room: ChatRoom
}

type SessionStatus = 'waiting' | 'running' | 'ended'

type ProblemPanelTab = 'problem' | 'submissions' | 'editorial'

const PROBLEM_PANEL_COLLAPSED_SIZE_PX = 56
const PROBLEM_PANEL_EXPANDED_MIN_SIZE_PX = 220
const problemPanelRailItems = [
  { value: 'problem' as const, label: 'Problem', icon: FileText },
  { value: 'submissions' as const, label: 'Submissions', icon: ScrollText },
  { value: 'editorial' as const, label: 'Editorial', icon: BookOpen },
]

type SessionPanelTab = 'chat' | 'players'

const SESSION_PANEL_COLLAPSED_SIZE_PX = 56
const SESSION_PANEL_EXPANDED_MIN_SIZE_PX = 280
const sessionPanelRailItems = [
  { value: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { value: 'players' as const, label: 'Players', icon: Users },
]

function ProblemPanelRail({
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
                    : 'border-r-2 border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-slate-200',
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

function SessionPanelRail({
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
                    : 'border-l-2 border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-slate-200',
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

type MockProblem = {
  id: string
  shortLabel: string
  title: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  topics: string[]
  description: string
  inputExplanation: string
  outputExplanation: string
  constraints: string[]
  sampleInput: string
  sampleOutput: string
  hints: string[]
}

const formatSessionClock = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':')
}

const splitDurationMinutes = (totalMinutes: number) => {
  const safeMinutes = Math.max(0, totalMinutes)

  return {
    hours: Math.floor(safeMinutes / 60),
    minutes: safeMinutes % 60,
  }
}


const getFirstVisibleExample = (problem: AssignedRoomProblem) => {
  if (problem.examples && problem.examples.length > 0) {
    const firstExample = problem.examples[0]

    return {
      input: firstExample.input,
      output: firstExample.output,
    }
  }

  const firstVisibleTestCase = problem.visibleTestCases[0]

  if (firstVisibleTestCase) {
    return {
      input: firstVisibleTestCase.input,
      output: firstVisibleTestCase.expectedOutput,
    }
  }

  return {
    input: 'No visible sample input available yet.',
    output: 'No visible sample output available yet.',
  }
}

const mapAssignedProblemToPanelProblem = (problem: AssignedRoomProblem): MockProblem => {
  const firstExample = getFirstVisibleExample(problem)

  return {
    id: problem.id,
    shortLabel: problem.shortLabel || 'P' + problem.order,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
    description: problem.description,
    inputExplanation: problem.inputFormat || 'Read input from standard input.',
    outputExplanation: problem.outputFormat || 'Print the expected answer to standard output.',
    constraints: problem.constraints.length > 0 ? problem.constraints : ['No constraints provided yet.'],
    sampleInput: firstExample.input,
    sampleOutput: firstExample.output,
    hints: problem.visibleTestCases.map((testCase) => 'Visible test ' + testCase.order + ': ' + testCase.input),
  }
}

const toSessionSeconds = (hours: number, minutes: number) => {
  return Math.max(0, hours) * 3600 + Math.max(0, minutes) * 60
}

const clampTimerPart = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) {
    return min
  }

  return Math.min(max, Math.max(min, value))
}

function CompetingSessionTimer({
  canManage,
  draftHours,
  draftMinutes,
  onDraftHoursChange,
  onDraftMinutesChange,
  onReset,
  onStart,
  onEnd,
  remainingSeconds,
  sessionStatus,
}: {
  canManage: boolean
  draftHours: number
  draftMinutes: number
  onDraftHoursChange: (hours: number) => void
  onDraftMinutesChange: (minutes: number) => void
  onReset: () => void
  onStart: () => void
  onEnd?: () => void
  remainingSeconds: number
  sessionStatus: SessionStatus
}) {
  const [isTimerMenuOpen, setIsTimerMenuOpen] = useState(false)
  const isRunning = sessionStatus === 'running'
  const isEnded = sessionStatus === 'ended'
  const draftSeconds = toSessionSeconds(draftHours, draftMinutes)
  const clockSeconds = isRunning || isEnded ? remainingSeconds : draftSeconds
  const clockLabel = formatSessionClock(clockSeconds)
  const canStart = draftSeconds > 0

  const applyDraftFromInputs = (hours: number, minutes: number) => {
    const nextHours = clampTimerPart(hours, 0, 23)
    let nextMinutes = clampTimerPart(minutes, 0, 59)

    if (nextHours === 0 && nextMinutes === 0) {
      nextMinutes = 1
    }

    onDraftHoursChange(nextHours)
    onDraftMinutesChange(nextMinutes)
  }

  if (!canManage) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5">
        <Clock3 size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
        <span className="font-mono text-sm font-semibold tabular-nums text-white">{clockLabel}</span>
        {sessionStatus === 'waiting' ? (
          <span className="text-xs text-slate-500">Waiting</span>
        ) : null}
        {isEnded ? <span className="text-xs text-amber-200">Ended</span> : null}
      </div>
    )
  }

  return (
    <div className={[
      'flex items-center gap-0.5 rounded-lg border bg-white/[0.035] p-0.5',
      isRunning
        ? 'border-emerald-300/25'
        : isEnded
          ? 'border-amber-300/25'
          : 'border-white/10',
    ].join(' ')}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-8 shrink-0"
        onClick={onStart}
        disabled={isRunning || !canStart}
        aria-label="Start session timer"
      >
        <Play size={14} aria-hidden="true" />
      </Button>

      <DropdownMenu open={isTimerMenuOpen} onOpenChange={setIsTimerMenuOpen}>
        <DropdownMenuTrigger asChild disabled={isRunning}>
          <button
            type="button"
            className={[
              'min-w-[84px] rounded-md px-2 py-1 font-mono text-sm tabular-nums transition',
              isRunning
                ? 'text-white font-semibold'
                : isEnded
                  ? 'text-slate-400 font-semibold'
                  : 'text-white font-semibold hover:bg-white/[0.05]',
              isRunning ? 'cursor-default' : 'cursor-pointer',
            ].join(' ')}
            aria-label="Set session timer"
          >
            {clockLabel}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="bottom"
          sideOffset={10}
          className="w-[220px] overflow-hidden rounded-xl border border-white/10 bg-black/85 p-0 text-slate-200 shadow-2xl shadow-black/60 backdrop-blur-xl data-[state=closed]:animate-out data-[state=closed]:duration-150 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:duration-200 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <span className="grid size-7 place-items-center rounded-full border border-amber-300/20 bg-amber-400/10 text-amber-200">
              <Clock3 size={14} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-white">Session timer</p>
              <p className="text-[10px] text-slate-500">Set hours and minutes</p>
            </div>
          </div>

          <div className="space-y-3 px-3 py-3">
            <div className="flex items-center justify-center gap-3">
              <label className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">hr</span>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={draftHours}
                  onChange={(event) => {
                    applyDraftFromInputs(Number(event.target.value), draftMinutes)
                  }}
                  className="h-9 w-14 border-white/10 bg-white/[0.04] text-center font-mono text-sm text-white"
                />
              </label>
              <label className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">min</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={draftMinutes}
                  onChange={(event) => {
                    applyDraftFromInputs(draftHours, Number(event.target.value))
                  }}
                  className="h-9 w-14 border-white/10 bg-white/[0.04] text-center font-mono text-sm text-white"
                />
              </label>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              className="h-9 w-full"
              disabled={!canStart}
              onClick={() => {
                onStart()
                setIsTimerMenuOpen(false)
              }}
            >
              <Play size={14} aria-hidden="true" />
              Start Timer
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-8 shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        onClick={onEnd}
        disabled={!isRunning}
        aria-label="End session timer"
      >
        <StopCircle size={14} aria-hidden="true" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-8 shrink-0 border-white/10 hover:border-[#3B82F6]/40 hover:bg-transparent hover:text-white"
        onClick={onReset}
        disabled={!isRunning && !isEnded}
        aria-label="Reset session timer"
      >
        <RotateCcw size={14} aria-hidden="true" />
      </Button>
    </div>
  )
}



const difficultyClassName: Record<string, string> = {
  EASY: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  MEDIUM: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  HARD: 'border-red-300/25 bg-red-400/10 text-red-200',
}

const submissionStatusClassName: Record<string, string> = {
  ACCEPTED: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  WRONG_ANSWER: 'border-red-300/25 bg-red-400/10 text-red-200',
  COMPILATION_ERROR: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  RUNTIME_ERROR: 'border-red-300/25 bg-red-400/10 text-red-200',
  TIME_LIMIT_EXCEEDED: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  INTERNAL_ERROR: 'border-slate-300/25 bg-slate-400/10 text-slate-200',
  Accepted: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  'Wrong Answer': 'border-red-300/25 bg-red-400/10 text-red-200',
  'Compilation Error': 'border-amber-300/25 bg-amber-400/10 text-amber-200',
}

const formatSubmissionStatus = (status: string) => {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const getSubmissionStatusClassName = (status: string) => {
  return submissionStatusClassName[status] ?? 'border-slate-300/25 bg-slate-400/10 text-slate-200'
}

const formatDifficulty = (difficulty?: ChatRoom['difficulty']) => {
  if (!difficulty) {
    return 'Medium'
  }

  return difficulty[0] + difficulty.slice(1).toLowerCase()
}

const getOnlineMemberIds = (onlineUsers: Array<{ id: string }>) => {
  return new Set(onlineUsers.map((onlineUser) => onlineUser.id))
}


function ProblemPanel({
  problems,
  isLoadingProblems = false,
  problemLoadError = null,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  isCollapsed = false,
  onExpandRequest,
  selectedProblemId,
  onSelectedProblemIdChange,
  submissions,
}: {
  problems: MockProblem[]
  isLoadingProblems?: boolean
  problemLoadError?: string | null
  activeTab?: ProblemPanelTab
  onActiveTabChange?: (tab: ProblemPanelTab) => void
  isCollapsed?: boolean
  onExpandRequest?: (tab: ProblemPanelTab) => void
  selectedProblemId: string | null
  onSelectedProblemIdChange: (problemId: string) => void
  submissions: SubmissionHistoryItem[]
}) {
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionHistoryItem | null>(null)
  const [internalActiveTab, setInternalActiveTab] = useState<ProblemPanelTab>('problem')
  const activeTab = controlledActiveTab ?? internalActiveTab


  const setActiveTab = (nextTab: ProblemPanelTab) => {
    if (onActiveTabChange) {
      onActiveTabChange(nextTab)
      return
    }

    setInternalActiveTab(nextTab)
  }

  const storedSelectedProblemIndex = problems.findIndex((problem) => problem.id === selectedProblemId)
  const selectedProblemIndex = storedSelectedProblemIndex >= 0 ? storedSelectedProblemIndex : problems.length > 0 ? 0 : -1
  const selectedProblem = selectedProblemIndex >= 0 ? problems[selectedProblemIndex] : null
  const currentProblemNumber = selectedProblemIndex >= 0 ? selectedProblemIndex + 1 : 0
  const isSubmissionCodeBlocked = Boolean(selectedSubmission && !selectedSubmission.canViewCode)
  const problemLabelById = useMemo(() => {
    const map = new Map<string, string>()
    problems.forEach((problem, index) => {
      map.set(problem.id, problem.shortLabel || `P${index + 1}`)
    })
    return map
  }, [problems])
  const getSubmissionProblemLabel = (submission: SubmissionHistoryItem) => (
    problemLabelById.get(submission.problemId) ?? submission.problemLabel ?? 'Problem'
  )
  const getSubmissionDisplayId = (submission: SubmissionHistoryItem) => submission.id.slice(-4).toUpperCase()
  const selectedSubmissionDisplayId = selectedSubmission ? getSubmissionDisplayId(selectedSubmission) : ''
  const selectedSubmissionProblemLabel = selectedSubmission ? getSubmissionProblemLabel(selectedSubmission) : 'Problem'

  const selectProblemAtIndex = (nextIndex: number) => {
    const nextProblem = problems[nextIndex]

    if (nextProblem) {
      onSelectedProblemIdChange(nextProblem.id)
    }
  }

  const handleRailSelect = (tab: ProblemPanelTab) => {
    setActiveTab(tab)
    onExpandRequest?.(tab)
  }

  const panelTabs = (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ProblemPanelTab)}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden"
    >
      <div className="min-w-0 shrink-0 overflow-hidden border-b border-white/10 bg-black/20 px-3 py-2">
        <TabsList variant="competing" className="flex h-9 w-full min-w-0 overflow-hidden">
          <TabsTrigger
            value="problem"
            className="flex items-center gap-1.5 px-3 border border-transparent data-[state=active]:!border-blue-500/40 data-[state=active]:!bg-blue-500/12 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all duration-150"
          >
            <FileText size={15} className="shrink-0" aria-hidden="true" />
            Problem
          </TabsTrigger>
          <TabsTrigger
            value="submissions"
            className="flex items-center gap-1.5 px-3 border border-transparent data-[state=active]:!border-emerald-500/40 data-[state=active]:!bg-emerald-500/12 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all duration-150"
          >
            <ScrollText size={15} className="shrink-0" aria-hidden="true" />
            Submissions
          </TabsTrigger>
          <TabsTrigger
            value="editorial"
            className="flex items-center gap-1.5 px-3 border border-transparent data-[state=active]:!border-amber-300/35 data-[state=active]:!bg-amber-400/10 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(245,158,11,0.25)] transition-all duration-150"
          >
            <BookOpen size={15} className="shrink-0" aria-hidden="true" />
            Editorial
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <TabsContent
          value="problem"
          className="m-0 min-w-0 max-w-full overflow-hidden p-4 sm:p-5"
        >
          <div className="min-w-0 max-w-full space-y-5 overflow-hidden">
            <section className="overflow-hidden border-b border-white/10 pb-3">
              <div
                className="flex max-w-full items-center justify-center gap-1 overflow-hidden sm:gap-1.5"
                aria-label={`Problem ${currentProblemNumber} of ${problems.length}`}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!selectedProblem || selectedProblemIndex <= 0}
                  onClick={() => selectProblemAtIndex(selectedProblemIndex - 1)}
                  aria-label="Previous problem"
                  className="size-8 shrink-0 border border-white/10 text-slate-300 bg-transparent hover:!border-blue-500/40 hover:!bg-transparent hover:!text-white hover:shadow-[0_0_12px_rgba(59,130,246,0.25)] active:!border-blue-500/50 active:shadow-[0_0_14px_rgba(59,130,246,0.35)] transition-all duration-200 cursor-pointer"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                </Button>
                {problems.map((problem) => {
                  const isSelected = selectedProblem ? problem.id === selectedProblem.id : false
                  
                  
                  let difficultyStyles = ''
                  if (isSelected) {
                    if (problem.difficulty === 'EASY') {
                      difficultyStyles = 'border-emerald-500/40 bg-transparent text-white shadow-[0_0_14px_rgba(16,185,129,0.25)]'
                    } else if (problem.difficulty === 'HARD') {
                      difficultyStyles = 'border-red-500/40 bg-transparent text-white shadow-[0_0_14px_rgba(239,68,68,0.25)]'
                    } else {
                      
                      difficultyStyles = 'border-amber-500/40 bg-transparent text-white shadow-[0_0_14px_rgba(245,158,11,0.25)]'
                    }
                  } else {
                    if (problem.difficulty === 'EASY') {
                      difficultyStyles = 'border-white/10 text-slate-400 hover:border-emerald-500/30 hover:bg-transparent hover:text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    } else if (problem.difficulty === 'HARD') {
                      difficultyStyles = 'border-white/10 text-slate-400 hover:border-red-500/30 hover:bg-transparent hover:text-white hover:shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                    } else {
                      
                      difficultyStyles = 'border-white/10 text-slate-400 hover:border-amber-500/30 hover:bg-transparent hover:text-white hover:shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                    }
                  }

                  return (
                    <Button
                      key={problem.id}
                      type="button"
                      variant={isSelected ? 'secondary' : 'ghost'}
                      size="sm"
                      className={[
                        'h-8 min-w-9 shrink-0 px-2.5 text-xs border transition-all duration-200',
                        difficultyStyles,
                      ].join(' ')}
                      onClick={() => onSelectedProblemIdChange(problem.id)}
                      aria-pressed={isSelected}
                      aria-label={`Problem ${problem.shortLabel}`}
                    >
                      {problem.shortLabel}
                    </Button>
                  )
                })}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!selectedProblem || selectedProblemIndex >= problems.length - 1}
                  onClick={() => selectProblemAtIndex(selectedProblemIndex + 1)}
                  aria-label="Next problem"
                  className="size-8 shrink-0 border border-white/10 text-slate-300 bg-transparent hover:!border-blue-500/40 hover:!bg-transparent hover:!text-white hover:shadow-[0_0_12px_rgba(59,130,246,0.25)] active:!border-blue-500/50 active:shadow-[0_0_14px_rgba(59,130,246,0.35)] transition-all duration-200 cursor-pointer"
                >
                  <ChevronRight size={14} aria-hidden="true" />
                </Button>
              </div>
            </section>

            {isLoadingProblems ? (
              <div className="space-y-5 overflow-hidden" aria-label="Loading assigned problems">
                <section className="space-y-4 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 overflow-hidden">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-white/[0.08]" />
                    <div className="h-6 w-32 animate-pulse rounded-full bg-white/[0.06]" />
                    <div className="h-6 w-24 animate-pulse rounded-full bg-white/[0.06]" />
                  </div>
                  <div className="space-y-3 overflow-hidden">
                    <div className="h-7 w-3/5 animate-pulse rounded-md bg-white/[0.08]" />
                    <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-white/[0.06]" />
                  </div>
                </section>

                <section className="grid gap-3 overflow-hidden">
                  <div className="h-28 animate-pulse rounded-xl border border-white/8 bg-white/[0.035]" />
                  <div className="h-28 animate-pulse rounded-xl border border-white/8 bg-white/[0.035]" />
                </section>

                <section className="space-y-3 overflow-hidden">
                  <div className="h-5 w-24 animate-pulse rounded bg-white/[0.08]" />
                  <div className="grid gap-2 overflow-hidden">
                    <div className="h-10 animate-pulse rounded-lg border border-white/8 bg-black/25" />
                    <div className="h-10 animate-pulse rounded-lg border border-white/8 bg-black/25" />
                  </div>
                </section>
              </div>
            ) : problemLoadError ? (
              <Card className="border-red-300/20 bg-red-400/[0.06] py-8 text-center shadow-none">
                <CardContent className="px-5 text-sm text-red-100">
                  {problemLoadError}
                </CardContent>
              </Card>
            ) : !selectedProblem ? (
              <Card className="border-white/10 bg-white/[0.035] py-8 text-center shadow-none">
                <CardContent className="px-5 text-sm text-slate-400">
                  No problems are assigned to this room yet.
                </CardContent>
              </Card>
            ) : (
              <>
              <section className="space-y-4 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 overflow-hidden">
                  <Badge className={difficultyClassName[selectedProblem.difficulty]}>
                    {formatDifficulty(selectedProblem.difficulty)}
                  </Badge>
                  {selectedProblem.topics.map((topic) => (
                    <Badge
                      key={topic}
                      className="border-zinc-500/20 bg-zinc-500/10 text-zinc-300"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <h2 className="break-words text-xl font-semibold tracking-tight text-white">
                    {selectedProblem.title}
                  </h2>
                  <p className="mt-3 break-words text-sm leading-6 text-slate-400">
                    {selectedProblem.description}
                  </p>
                </div>
              </section>

              <section className="grid gap-3 overflow-hidden">
                <div className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.025] p-4">
                  <h3 className="text-sm font-semibold text-white">Input</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedProblem.inputExplanation}
                  </p>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.025] p-4">
                  <h3 className="text-sm font-semibold text-white">Output</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedProblem.outputExplanation}
                  </p>
                </div>
              </section>

              <section className="space-y-3 overflow-hidden">
                <h3 className="text-sm font-semibold text-white">Constraints</h3>
                <div className="grid gap-2 overflow-hidden">
                  {selectedProblem.constraints.map((constraint) => (
                    <code
                      key={constraint}
                      className="block overflow-hidden rounded-lg border border-white/8 bg-black/25 px-3 py-2 font-mono text-xs leading-5 break-words text-slate-300"
                    >
                      {constraint}
                    </code>
                  ))}
                </div>
              </section>

              <section className="space-y-3 overflow-hidden">
                <h3 className="text-sm font-semibold text-white">Example</h3>
                <div className="grid grid-cols-1 gap-3 overflow-hidden lg:grid-cols-2">
                  <div className="overflow-hidden rounded-xl border border-white/8 bg-black/25 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Input
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap font-mono text-sm text-slate-200">
                      {selectedProblem.sampleInput}
                    </pre>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-white/8 bg-black/25 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Output
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap font-mono text-sm text-slate-200">
                      {selectedProblem.sampleOutput}
                    </pre>
                  </div>
                </div>
              </section>

              <Accordion
                type="single"
                collapsible
                className="rounded-xl border border-white/8 bg-white/[0.035] px-4"
              >
                <AccordionItem value="hint" className="border-white/8">
                  <AccordionTrigger className="text-white hover:no-underline">
                    Hints
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm leading-6 text-slate-400">
                      {selectedProblem.hints.map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              </>
            )}
            </div>
          </TabsContent>

          <TabsContent value="submissions" className="m-0 min-w-0 max-w-full overflow-hidden p-4 sm:p-5">
            <div className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
              <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                <h2 className="text-lg font-semibold text-white">Submissions</h2>
                <p className="mt-1 text-sm text-slate-400">Shared submission history for this problem.</p>
              </div>
              <div className="w-0 min-w-full overflow-x-auto overscroll-x-contain [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-white/[0.04]">
                <table className="w-max min-w-full caption-bottom text-sm">
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="px-3 text-slate-400">#</TableHead>
                      <TableHead className="px-3 text-slate-400">When</TableHead>
                      <TableHead className="px-3 text-slate-400">Who</TableHead>
                      <TableHead className="px-3 text-slate-400">Problem</TableHead>
                      <TableHead className="px-3 text-slate-400">Lang</TableHead>
                      <TableHead className="px-3 text-slate-400">Verdict</TableHead>
                      <TableHead className="px-3 text-slate-400">Time</TableHead>
                      <TableHead className="px-3 text-slate-400">Memory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id} className="border-white/8 hover:bg-white/[0.035]">
                        <TableCell className="px-3">
                          {submission.canViewCode ? (
                            <button
                              type="button"
                              className="font-mono text-sm font-semibold text-[#7FFFE0] underline-offset-4 hover:underline cursor-pointer"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              {getSubmissionDisplayId(submission)}
                            </button>
                          ) : (
                            <span className="font-mono text-sm font-semibold text-slate-500" title="Available after contest ends">
                              {getSubmissionDisplayId(submission)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 text-slate-400">
                          {new Date(submission.submittedAt).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="px-3 text-slate-200">{submission.username}</TableCell>
                        <TableCell className="px-3 text-slate-200">{getSubmissionProblemLabel(submission)}</TableCell>
                        <TableCell className="px-3 text-slate-300">{submission.language}</TableCell>
                        <TableCell className="px-3">
                          <Badge className={getSubmissionStatusClassName(submission.status)}>
                            {formatSubmissionStatus(submission.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 text-slate-400">{submission.runtimeMs ? `${submission.runtimeMs} ms` : '-'}</TableCell>
                        <TableCell className="whitespace-nowrap px-3 text-slate-400">{submission.memoryKb ? `${Math.round(submission.memoryKb / 1024)} MB` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editorial" className="m-0 min-w-0 overflow-hidden p-4 sm:p-5">
            <Card className="border-white/10 bg-white/[0.035] py-8 text-center shadow-none">
              <CardHeader className="items-center px-5">
                <div className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#D6FFF6]">
                  <Trophy size={20} aria-hidden="true" />
                </div>
                <CardTitle className="text-lg text-white">Editorial locked</CardTitle>
                <CardDescription className="max-w-sm leading-6">
                  Editorial will be available after the session.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
  )

  const submissionDialog = (
      <Dialog
        open={Boolean(selectedSubmission)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedSubmission(null)
          }
        }}
      >
        <DialogContent className="max-h-[80dvh] max-w-lg overflow-hidden border-white/10 bg-[#0B0D0F]/98 text-white" overlayClassName="backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>{selectedSubmissionDisplayId ? `Submission #${selectedSubmissionDisplayId}` : 'Submission Details'}</DialogTitle>
          </DialogHeader>

          {selectedSubmission ? (
            isSubmissionCodeBlocked ? (
              <Card className="border-amber-300/20 bg-amber-400/[0.06] py-0 shadow-none">
                <CardContent className="p-5 text-sm text-amber-100">
                  Code is available after the session ends.
                </CardContent>
              </Card>
            ) : (
              <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-400">{selectedSubmission.language}</span>
                  <span className="text-white/20">Â·</span>
                  <Badge className={getSubmissionStatusClassName(selectedSubmission.status)}>
                    {formatSubmissionStatus(selectedSubmission.status)}
                  </Badge>
                  <span className="text-white/20">Â·</span>
                  <span className="text-sm text-slate-400">{selectedSubmission.runtimeMs ? `${selectedSubmission.runtimeMs} ms` : '-'}</span>
                  <span className="text-white/20">Â·</span>
                  <span className="text-sm text-slate-400">{selectedSubmission.memoryKb ? `${Math.round(selectedSubmission.memoryKb / 1024)} MB` : '-'}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ['User', selectedSubmission.username],
                    ['Problem', selectedSubmissionProblemLabel],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-white/8 bg-white/[0.035] p-2.5">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-200">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Submitted code</span>
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
                      onClick={(e) => {
                        void navigator.clipboard.writeText(selectedSubmission.code ?? '')
                        const btn = e.currentTarget
                        const original = btn.innerHTML
                        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400"><path d="M20 6 9 17l-5-5"/></svg><span class="text-emerald-400">Copied!</span>`
                        setTimeout(() => { btn.innerHTML = original }, 1500)
                      }}
                      aria-label="Copy code"
                    >
                      <Copy size={13} aria-hidden="true" />
                      Copy
                    </button>
                  </div>
                  <pre className="max-h-[42dvh] overflow-auto p-4 font-mono text-sm leading-6 text-slate-200">
                    <code>{selectedSubmission.code}</code>
                  </pre>
                </div>
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>
  )

  if (isCollapsed) {
    return (
      <>
        <aside className="flex h-full min-h-0 min-w-0 overflow-hidden border-r border-white/10 bg-[#080D14]/95">
          <ProblemPanelRail activeTab={activeTab} onSelect={handleRailSelect} />
        </aside>
        {submissionDialog}
      </>
    )
  }

  return (
    <>
      <aside className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/10 bg-[#080D14]/90">
        {panelTabs}
      </aside>
      {submissionDialog}
    </>
  )
}


function MembersAndChatPanel({
  connectionStatus,
  hasMoreMessages,
  isLoadingHistory,
  isLoadingOlder,
  loadOlderMessages,
  members,
  messages,
  onlineUsers,
  retryMessage,
  room,
  sendMessage,
  sendStopTyping,
  sendTyping,
  typingUsers,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  isCollapsed = false,
  onExpandRequest,
}: {
  connectionStatus: 'connecting' | 'online' | 'offline'
  hasMoreMessages: boolean
  isLoadingHistory: boolean
  isLoadingOlder: boolean
  loadOlderMessages: () => Promise<void> | void
  members: RoomMember[]
  messages: ReturnType<typeof useChatSocket>['messages']
  onlineUsers: ReturnType<typeof useChatSocket>['onlineUsers']
  retryMessage: ReturnType<typeof useChatSocket>['retryMessage']
  room: ChatRoom
  sendMessage: ReturnType<typeof useChatSocket>['sendMessage']
  sendStopTyping: ReturnType<typeof useChatSocket>['sendStopTyping']
  sendTyping: ReturnType<typeof useChatSocket>['sendTyping']
  typingUsers: ReturnType<typeof useChatSocket>['typingUsers']
  activeTab?: SessionPanelTab
  onActiveTabChange?: (tab: SessionPanelTab) => void
  isCollapsed?: boolean
  onExpandRequest?: (tab: SessionPanelTab) => void
}) {
  const [internalActiveTab, setInternalActiveTab] = useState<SessionPanelTab>('chat')
  const activeTab = controlledActiveTab ?? internalActiveTab

  const setActiveTab = (nextTab: SessionPanelTab) => {
    if (onActiveTabChange) {
      onActiveTabChange(nextTab)
      return
    }

    setInternalActiveTab(nextTab)
  }

  const handleRailSelect = (tab: SessionPanelTab) => {
    setActiveTab(tab)
    onExpandRequest?.(tab)
  }

  const onlineMemberIds = getOnlineMemberIds(onlineUsers)
  const onlineCount = members.filter((member) => onlineMemberIds.has(member.id)).length

  const panelTabs = (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as SessionPanelTab)}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <div className="min-w-0 shrink-0 overflow-hidden border-b border-white/10 bg-black/20 px-3 py-2">
        <div className="flex min-w-0 items-center justify-between gap-2 overflow-hidden">
          <TabsList variant="competing" className="flex h-9 min-w-0 overflow-hidden">
            <TabsTrigger
              value="chat"
              className="px-3 data-[state=active]:!bg-emerald-500/12 data-[state=active]:!text-white"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="px-3 data-[state=active]:!bg-emerald-500/12 data-[state=active]:!text-white"
            >
              Players
            </TabsTrigger>
          </TabsList>
          <Badge className="shrink-0 border !border-blue-500/30 bg-blue-500/10 !text-white shadow-[0_0_8px_rgba(59,130,246,0.2)]">
            <Users size={13} aria-hidden="true" />
            {onlineCount} online
          </Badge>
        </div>
      </div>

      <TabsContent
        value="chat"
        className="m-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=active]:flex"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <MessageList
              connectionStatus={connectionStatus}
              hasMoreMessages={hasMoreMessages}
              isLoadingHistory={isLoadingHistory}
              isLoadingOlder={isLoadingOlder}
              messages={messages}
              onLoadOlderMessages={loadOlderMessages}
              onRetryMessage={retryMessage}
              variant="sidebar"
            />
          </div>
          <TypingIndicator typingUsers={typingUsers} variant="sidebar" />
          <MessageInput
            disabled={connectionStatus !== 'online'}
            onSend={sendMessage}
            onStopTyping={sendStopTyping}
            onTyping={sendTyping}
            roomName={room.name}
            variant="sidebar"
          />
        </div>
      </TabsContent>

      <TabsContent
        value="players"
        className="m-0 min-h-0 min-w-0 flex-1 overflow-hidden data-[state=active]:flex"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 overflow-hidden border-b border-white/10 px-4 py-4">
            <p className="truncate text-sm font-semibold text-white">Session players</p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {onlineCount} online Â· {members.length || 1} total
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="space-y-3 p-4">
              {members.length ? (
                members.map((member) => {
                  const isOnline = onlineMemberIds.has(member.id)

                  return (
                    <Card
                      key={member.id}
                      className="border-white/10 bg-white/[0.035] py-0 shadow-none"
                    >
                      <CardContent className="flex items-center justify-between gap-3 overflow-hidden p-3">
                        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                          <Avatar name={member.username} seed={member.email} size="sm" />
                          <div className="min-w-0 overflow-hidden">
                            <p className="truncate text-sm font-semibold text-white">
                              {member.username}
                            </p>
                            <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden">
                              <Badge className="shrink-0 border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                {member.role.toLowerCase()}
                              </Badge>
                              <span className="truncate text-xs text-slate-500">
                                {member.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={[
                            'size-2.5 shrink-0 rounded-full',
                            isOnline
                              ? 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.55)]'
                              : 'bg-slate-600',
                          ].join(' ')}
                          aria-label={isOnline ? 'Online' : 'Offline'}
                        />
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card className="border-white/10 bg-white/[0.035] py-0 shadow-none">
                  <CardContent className="p-4 text-sm text-slate-400">
                    Player list is loading.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )

  if (isCollapsed) {
    return (
      <aside className="flex h-full min-h-0 min-w-0 overflow-hidden border-l border-white/10 bg-[#080D14]/95">
        <SessionPanelRail activeTab={activeTab} onSelect={handleRailSelect} />
      </aside>
    )
  }

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l border-white/10 bg-[#080D14]/90">
      {panelTabs}
    </aside>
  )
}

function EditorPanel({
  competingProblemId,
  connectionStatus,
  room,
  onSubmitSuccess,
}: {
  competingProblemId?: string | null
  connectionStatus: 'connecting' | 'online' | 'offline'
  room: ChatRoom
  onSubmitSuccess?: () => void
}) {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050911]">
      <Suspense fallback={<EditorSkeleton />}>
        <LazyCodeEditorWorkspace
          activeCollaborators={[]}
          connectionStatus={connectionStatus}
          room={room}
          toolbarMode="competing"
          competingProblemId={competingProblemId}
          onSubmitSuccess={onSubmitSuccess}
        />
      </Suspense>
    </main>
  )
}


export function CompetingRoomWorkspace({ room }: CompetingRoomWorkspaceProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const roomDisplay = getRoomDisplayInfo(room)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [membersError, setMembersError] = useState<string | null>(null)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'unavailable'>('idle')
  const initialDurationMinutes = room.durationMinutes ?? 45
  const initialDraft = splitDurationMinutes(initialDurationMinutes)
  const [draftHours, setDraftHours] = useState(initialDraft.hours)
  const [draftMinutes, setDraftMinutes] = useState(initialDraft.minutes)
  const getInitialSessionStatus = (): SessionStatus => {
    const backendStatus = (room.sessionStatus?.toLowerCase() as SessionStatus | undefined) ?? 'waiting'
    const totalSeconds = toSessionSeconds(initialDraft.hours, initialDraft.minutes)

    if (backendStatus === 'running' && room.sessionStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(room.sessionStartedAt).getTime()) / 1000)
      return elapsed >= totalSeconds ? 'ended' : 'running'
    }

    return backendStatus
  }
  const initialSessionStatus = getInitialSessionStatus()
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(initialSessionStatus)
  const [submissions, setSubmissions] = useState<SubmissionHistoryItem[]>([])
  const [showEndedModal, setShowEndedModal] = useState(false)
  const previousSessionStatusRef = useRef<SessionStatus | null>(initialSessionStatus)
  const hasShownEndedPopupRef = useRef(false)
  const getInitialRemainingSeconds = () => {
    const totalSeconds = toSessionSeconds(initialDraft.hours, initialDraft.minutes)

    if (initialSessionStatus === 'ended') {
      return 0
    }

    if (initialSessionStatus === 'running' && room.sessionStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(room.sessionStartedAt).getTime()) / 1000)
      return Math.max(0, totalSeconds - elapsed)
    }

    return totalSeconds
  }
  const [remainingSeconds, setRemainingSeconds] = useState(getInitialRemainingSeconds)
  const [problemPanelTab, setProblemPanelTab] = useState<ProblemPanelTab>('problem')
  const [assignedProblems, setAssignedProblems] = useState<MockProblem[]>([])
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const [isLoadingProblems, setIsLoadingProblems] = useState(true)
  const [problemLoadError, setProblemLoadError] = useState<string | null>(null)
  const [isProblemPanelCollapsed, setIsProblemPanelCollapsed] = useState(false)
  const problemPanelRef = useRef<PanelImperativeHandle | null>(null)
  const [sessionPanelTab, setSessionPanelTab] = useState<SessionPanelTab>('chat')
  const [isSessionPanelCollapsed, setIsSessionPanelCollapsed] = useState(false)
  const sessionPanelRef = useRef<PanelImperativeHandle | null>(null)

  const handleProblemPanelResize = (
    panelSize: { asPercentage: number; inPixels: number },
  ) => {
    const collapsedByPixels = panelSize.inPixels <= PROBLEM_PANEL_COLLAPSED_SIZE_PX + 10
    const collapsedByPercent = panelSize.asPercentage <= 5
    const collapsedByRef = problemPanelRef.current?.isCollapsed() === true

    setIsProblemPanelCollapsed(collapsedByPixels || collapsedByPercent || collapsedByRef)
  }

  const handleSessionPanelResize = (
    panelSize: { asPercentage: number; inPixels: number },
  ) => {
    const collapsedByPixels = panelSize.inPixels <= SESSION_PANEL_COLLAPSED_SIZE_PX + 10
    const collapsedByPercent = panelSize.asPercentage <= 5
    const collapsedByRef = sessionPanelRef.current?.isCollapsed() === true

    setIsSessionPanelCollapsed(collapsedByPixels || collapsedByPercent || collapsedByRef)
  }

  const handlePanelLayoutChanged = (layout: Record<string, number>) => {
    const problemPanelPercent = layout['competing-problem-panel']
    const sessionPanelPercent = layout['competing-session-panel']

    if (typeof problemPanelPercent === 'number') {
      setIsProblemPanelCollapsed(problemPanelPercent <= 5)
    }

    if (typeof sessionPanelPercent === 'number') {
      setIsSessionPanelCollapsed(sessionPanelPercent <= 5)
    }
  }

  const handleProblemPanelExpand = (tab: ProblemPanelTab) => {
    setProblemPanelTab(tab)
    problemPanelRef.current?.expand()
    setIsProblemPanelCollapsed(false)
  }

  const handleSessionPanelExpand = (tab: SessionPanelTab) => {
    setSessionPanelTab(tab)
    sessionPanelRef.current?.expand()
    setIsSessionPanelCollapsed(false)
  }

  const {
    connectionStatus,
    hasMoreMessages,
    isLoadingHistory,
    isLoadingOlder,
    loadOlderMessages,
    messages,
    onlineUsers,
    retryMessage,
    newSubmissionEvent,
    roomTimerEvent,
    sendMessage,
    sendStopTyping,
    sendTyping,
    typingUsers,
  } = useChatSocket(room.id, user?.id)

  const currentMember = members.find((member) => member.id === user?.id)
  const isAdmin = Boolean(user?.id && (room.adminId === user.id || currentMember?.role === 'ADMIN'))

  const fetchSubmissions = useCallback(async () => {
    if (!selectedProblemId) return
    try {
      const data = await editorService.getProblemSubmissions(room.id, selectedProblemId)
      setSubmissions(data)
    } catch (error) {
      console.error(error)
    }
  }, [room.id, selectedProblemId])

  const handleDeleteRoom = async () => {
    try {
      await roomService.delete(room.id)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error(error)
      toast.error('Room could not be deleted. Only the room admin can delete it.')
    }
  }

  const handleLeaveRoom = () => {
    navigate('/dashboard', { replace: true })
  }

  useEffect(() => {
    void fetchSubmissions()
  }, [fetchSubmissions, sessionStatus])

  useEffect(() => {
    if (
      newSubmissionEvent &&
      newSubmissionEvent.roomId === room.id &&
      newSubmissionEvent.problemId === selectedProblemId
    ) {
      void fetchSubmissions()
    }
  }, [newSubmissionEvent, fetchSubmissions, room.id, selectedProblemId])

  useEffect(() => {
    const previousStatus = previousSessionStatusRef.current

    if (
      previousStatus &&
      previousStatus !== 'ended' &&
      sessionStatus === 'ended' &&
      !hasShownEndedPopupRef.current
    ) {
      hasShownEndedPopupRef.current = true
      toast('Contest ended. Code review is now open.')
      setShowEndedModal(true)
      void fetchSubmissions()
    }

    if (sessionStatus !== 'ended') {
      hasShownEndedPopupRef.current = false
      setShowEndedModal(false)
    }

    previousSessionStatusRef.current = sessionStatus
  }, [fetchSubmissions, sessionStatus])

  useEffect(() => {
    if (!roomTimerEvent) return

    const status = roomTimerEvent.sessionStatus.toLowerCase() as SessionStatus
    const nextDurationMinutes = roomTimerEvent.durationMinutes ?? initialDurationMinutes
    const nextDraft = splitDurationMinutes(nextDurationMinutes)
    const totalSeconds = toSessionSeconds(nextDraft.hours, nextDraft.minutes)

    setDraftHours(nextDraft.hours)
    setDraftMinutes(nextDraft.minutes)
    setSessionStatus(status)

    if (status === 'running' && roomTimerEvent.sessionStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(roomTimerEvent.sessionStartedAt).getTime()) / 1000)
      setRemainingSeconds(Math.max(0, totalSeconds - elapsed))
    } else if (status === 'ended') {
      setRemainingSeconds(0)
    } else {
      setRemainingSeconds(totalSeconds)
    }
  }, [initialDurationMinutes, roomTimerEvent])

  const canManageTimer =
    room.adminId === user?.id || currentMember?.role === 'ADMIN' || (!room.adminId && members.length === 0)

  const selectedProblem = assignedProblems.find((problem) => problem.id === selectedProblemId) ?? assignedProblems[0] ?? null
  const selectedProblemRunId = selectedProblem?.id ?? null

  useEffect(() => {
    let isCurrentRequest = true

    const loadAssignedProblems = async () => {
      setIsLoadingProblems(true)
      setProblemLoadError(null)

      try {
        const roomProblems = await roomService.getProblems(room.id)

        if (!isCurrentRequest) {
          return
        }

        const mappedProblems = roomProblems.map(mapAssignedProblemToPanelProblem)
        setAssignedProblems(mappedProblems)
      } catch {
        if (!isCurrentRequest) {
          return
        }

        setAssignedProblems([])
        setProblemLoadError('Could not load assigned problems for this room.')
      } finally {
        if (isCurrentRequest) {
          setIsLoadingProblems(false)
        }
      }
    }

    void loadAssignedProblems()

    return () => {
      isCurrentRequest = false
    }
  }, [room.id])

  useEffect(() => {
    if (assignedProblems.length === 0) {
      setSelectedProblemId(null)
      return
    }

    const selectedProblemStillExists = assignedProblems.some((problem) => problem.id === selectedProblemId)

    if (!selectedProblemStillExists) {
      setSelectedProblemId(assignedProblems[0].id)
    }
  }, [assignedProblems, selectedProblemId])

  const handleCopyRoomCode = async () => {
    if (!room.joinCode || !navigator.clipboard) {
      setCopyStatus('unavailable')
      return
    }

    try {
      await navigator.clipboard.writeText(room.joinCode)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('unavailable')
    }
  }

  useEffect(() => {
    if (sessionStatus !== 'running') {
      return
    }

    const countdownInterval = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          window.clearInterval(countdownInterval)
          setSessionStatus('ended')

          if (canManageTimer) {
            void roomService.update(room.id, { sessionStatus: 'ENDED' }).catch(() => undefined)
          }

          return 0
        }

        return currentSeconds - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(countdownInterval)
    }
  }, [canManageTimer, room.id, sessionStatus])

  const handleStartTimer = async () => {
    const nextSeconds = toSessionSeconds(draftHours, draftMinutes)
    if (nextSeconds <= 0) return

    const selectedDurationMinutes = draftHours * 60 + draftMinutes
    try {
      await roomService.update(room.id, {
        sessionStatus: 'RUNNING',
        sessionStartedAt: new Date().toISOString(),
        durationMinutes: selectedDurationMinutes,
      })
      setRemainingSeconds(nextSeconds)
      setSessionStatus('running')
    } catch (error) { console.error(error) }
  }

  const handleResetTimer = async () => {
    try {
      await roomService.update(room.id, {
        sessionStatus: 'WAITING',
        sessionStartedAt: null,
      })
      hasShownEndedPopupRef.current = false
      previousSessionStatusRef.current = 'waiting'
      setShowEndedModal(false)
      setSessionStatus('waiting')
      setRemainingSeconds(toSessionSeconds(draftHours, draftMinutes))
    } catch (error) { console.error(error) }
  }

  const handleEndTimer = async () => {
    if (!canManageTimer) return

    try {
      await roomService.update(room.id, {
        sessionStatus: 'ENDED',
      })
      setRemainingSeconds(0)
      setSessionStatus('ended')
    } catch (error) { console.error(error) }
  }

  useEffect(() => {
    let isCurrentRequest = true

    const loadMembers = async () => {
      try {
        const roomMembers = await roomMemberService.list(room.id)

        if (isCurrentRequest) {
          setMembers(roomMembers)
          setMembersError(null)
        }
      } catch {
        if (isCurrentRequest) {
          setMembers([])
          setMembersError('Could not load members')
        }
      }
    }

    void loadMembers()

    return () => {
      isCurrentRequest = false
    }
  }, [room.id])


  return (
    <TooltipProvider>
      <section className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#05070A] text-[#E5E1E4]">
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#060A10]/95 px-3 py-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.26)] backdrop-blur-2xl sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              disabled
              className="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-slate-400 transition-all duration-200 cursor-default disabled:opacity-100 disabled:pointer-events-none disabled:border-white/10 disabled:bg-white/[0.035] disabled:shadow-none"
              aria-label="Back to dashboard"
            >
              <img src="/starsync-logo.png" alt="StarSync" className="size-5 rounded-full object-cover" />
            </button>

            <h1 className="min-w-0 truncate text-sm font-semibold text-white sm:text-[15px]">
              {roomDisplay.displayName}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <CompetingSessionTimer
              canManage={canManageTimer}
              draftHours={draftHours}
              draftMinutes={draftMinutes}
              onDraftHoursChange={(hours) => {
                setDraftHours(hours)

                if (sessionStatus === 'waiting') {
                  setRemainingSeconds(toSessionSeconds(hours, draftMinutes))
                }
              }}
              onDraftMinutesChange={(minutes) => {
                setDraftMinutes(minutes)

                if (sessionStatus === 'waiting') {
                  setRemainingSeconds(toSessionSeconds(draftHours, minutes))
                }
              }}
              onStart={handleStartTimer}
              onReset={handleResetTimer}
              onEnd={handleEndTimer}
              remainingSeconds={remainingSeconds}
              sessionStatus={sessionStatus}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden h-10 px-3.5 rounded-xl lg:inline-flex border-white/12 bg-white/[0.05] shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
              onClick={() => {
                setCopyStatus('idle')
                setIsInviteDialogOpen(true)
              }}
            >
              Invite
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Open room menu"
                  className="rounded-full border-white/10 bg-white/[0.035] text-slate-300 shadow-none hover:border-[#18D6A3]/40 hover:shadow-[0_0_12px_rgba(24,214,163,0.25)] active:border-[#18D6A3]/60 active:shadow-[0_0_14px_rgba(24,214,163,0.35)] focus-visible:border-white/10 focus-visible:ring-0 data-[state=open]:border-white/10 data-[state=open]:bg-white/[0.035]"
                >
                  <MoreVertical size={15} aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-white/10 bg-[#111113] text-slate-200">
                <DropdownMenuItem
                  onSelect={handleLeaveRoom}
                  className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-white/5 hover:text-white active:scale-95 transition transform duration-100 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/30"
                >
                  <LogOut size={14} aria-hidden="true" />
                  Leave room
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem
                    onSelect={handleDeleteRoom}
                    className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded text-red-400 hover:bg-red-900/30 hover:text-red-200 active:scale-95 transition transform duration-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Delete room
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>



        {membersError ? (
          <div className="shrink-0 border-b border-amber-300/20 bg-amber-950/20 px-4 py-2 text-xs text-amber-100">
            {membersError}
          </div>
        ) : null}

        <div className="hidden min-h-0 flex-1 overflow-hidden xl:block">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full min-h-0 w-full min-w-0 overflow-hidden"
            key={`competing-layout-${room.id}`}
            onLayoutChanged={handlePanelLayoutChanged}
          >
            <ResizablePanel
              id="competing-problem-panel"
              defaultSize="32%"
              minSize={`${PROBLEM_PANEL_EXPANDED_MIN_SIZE_PX}px`}
              maxSize="45%"
              collapsible
              collapsedSize={`${PROBLEM_PANEL_COLLAPSED_SIZE_PX}px`}
              panelRef={problemPanelRef}
              onResize={handleProblemPanelResize}
              groupResizeBehavior="preserve-pixel-size"
              className="min-h-0 min-w-0 overflow-hidden"
            >
              <div className="h-full min-h-0 min-w-0 overflow-hidden">
                <ProblemPanel
                  problems={assignedProblems}
                  isLoadingProblems={isLoadingProblems}
                  problemLoadError={problemLoadError}
                  activeTab={problemPanelTab}
                  onActiveTabChange={setProblemPanelTab}
                  isCollapsed={isProblemPanelCollapsed}
                  onExpandRequest={handleProblemPanelExpand}
                  selectedProblemId={selectedProblem?.id ?? null}
                  onSelectedProblemIdChange={setSelectedProblemId}
                  submissions={submissions}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="z-20 w-1.5 border-x border-white/5 bg-white/[0.025] transition hover:bg-[#57F1DB]/12" />
            <ResizablePanel
              id="competing-editor-panel"
              defaultSize="44%"
              minSize="30%"
              className="min-h-0 min-w-0 overflow-hidden"
            >
              <EditorPanel competingProblemId={selectedProblemRunId} connectionStatus={connectionStatus} room={room} />
            </ResizablePanel>
            <ResizableHandle withHandle className="z-20 w-1.5 border-x border-white/5 bg-white/[0.025] transition hover:bg-[#57F1DB]/12" />
            <ResizablePanel
              id="competing-session-panel"
              defaultSize="24%"
              minSize={`${SESSION_PANEL_EXPANDED_MIN_SIZE_PX}px`}
              maxSize="38%"
              collapsible
              collapsedSize={`${SESSION_PANEL_COLLAPSED_SIZE_PX}px`}
              panelRef={sessionPanelRef}
              onResize={handleSessionPanelResize}
              groupResizeBehavior="preserve-pixel-size"
              className="min-h-0 min-w-0 overflow-hidden"
            >
              <div className="h-full min-h-0 min-w-0 overflow-hidden">
                <MembersAndChatPanel
                  connectionStatus={connectionStatus}
                  hasMoreMessages={hasMoreMessages}
                  isLoadingHistory={isLoadingHistory}
                  isLoadingOlder={isLoadingOlder}
                  loadOlderMessages={loadOlderMessages}
                  members={members}
                  messages={messages}
                  onlineUsers={onlineUsers}
                  retryMessage={retryMessage}
                  room={room}
                  sendMessage={sendMessage}
                  sendStopTyping={sendStopTyping}
                  sendTyping={sendTyping}
                  typingUsers={typingUsers}
                  activeTab={sessionPanelTab}
                  onActiveTabChange={setSessionPanelTab}
                  isCollapsed={isSessionPanelCollapsed}
                  onExpandRequest={handleSessionPanelExpand}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <Modal
          isOpen={showEndedModal}
          onClose={() => setShowEndedModal(false)}
          title=""
          hideHeader
          size="sm"
          className="rounded-3xl p-0 bg-transparent"
        >
          <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="relative rounded-[14px] bg-[#18181B]/78 p-0 backdrop-blur-2xl text-center overflow-hidden">
              <div className="flex items-center justify-between gap-3 bg-gradient-to-b from-white/6 to-transparent px-4 py-3">
                <h3 className="text-lg font-bold text-[#F7F7F8]">Contest Ended<span className="ml-2 text-white">!</span></h3>
                <button
                  type="button"
                  onClick={() => setShowEndedModal(false)}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-lg border border-white/15 bg-gradient-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#D6FFF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] mx-auto">
                <Trophy size={26} />
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-[#F7F7F8]">The contest has ended</h3>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowEndedModal(false)}
                    className="inline-flex h-10 min-w-32 cursor-pointer items-center justify-center rounded-full border-2 border-emerald-300/45 bg-[#18D6A3] px-6 text-sm font-bold text-black shadow-[0_0_20px_rgba(24,214,163,0.28)] transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-200/70 hover:bg-[#20E6B0] hover:shadow-[0_0_28px_rgba(24,214,163,0.42)] active:translate-y-0 active:bg-[#16C796]"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <Tabs defaultValue="problem" className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-x-hidden overflow-y-hidden p-3 xl:hidden">
          <TabsList variant="competing" className="grid h-9 w-full grid-cols-3">
            <TabsTrigger value="problem" className="border border-transparent data-[state=active]:!border-blue-500/40 data-[state=active]:!bg-blue-500/12 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all duration-150">Problem</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:!bg-emerald-500/12 data-[state=active]:!text-white">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="problem" className="m-0 h-full min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <ProblemPanel
              problems={assignedProblems}
              isLoadingProblems={isLoadingProblems}
              problemLoadError={problemLoadError}
              selectedProblemId={selectedProblem?.id ?? null}
              onSelectedProblemIdChange={setSelectedProblemId}
              submissions={submissions}
            />
          </TabsContent>

          <TabsContent value="editor" className="m-0 h-full min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <EditorPanel competingProblemId={selectedProblemRunId} connectionStatus={connectionStatus} room={room} onSubmitSuccess={fetchSubmissions} />
          </TabsContent>

          <TabsContent value="chat" className="m-0 h-full min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <MembersAndChatPanel
              connectionStatus={connectionStatus}
              hasMoreMessages={hasMoreMessages}
              isLoadingHistory={isLoadingHistory}
              isLoadingOlder={isLoadingOlder}
              loadOlderMessages={loadOlderMessages}
              members={members}
              messages={messages}
              onlineUsers={onlineUsers}
              retryMessage={retryMessage}
              room={room}
              sendMessage={sendMessage}
              sendStopTyping={sendStopTyping}
              sendTyping={sendTyping}
              typingUsers={typingUsers}
            />
          </TabsContent>
        </Tabs>

        <Dialog
          open={isInviteDialogOpen}
          onOpenChange={(isOpen) => {
            setIsInviteDialogOpen(isOpen)
            if (isOpen) {
              setCopyStatus('idle')
            }
          }}
        >
          <DialogContent
            overlayClassName="bg-black/35 backdrop-blur-md data-[state=open]:backdrop-blur-md"
            className="!border-none !bg-transparent !shadow-none !p-0 max-w-sm"
            showCloseButton={false}
          >
            <div className="w-full rounded-3xl border border-white/10 bg-zinc-950/90 p-5 shadow-2xl shadow-black/50">
              <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
                <div className="relative rounded-[14px] bg-[#18181B]/78 p-0 backdrop-blur-2xl text-center overflow-hidden">
                  <div className="flex items-center justify-between gap-3 bg-gradient-to-b from-white/6 to-transparent px-4 py-3">
                    <h3 className="text-lg font-bold text-[#F7F7F8]">Invite Teammates</h3>
                    <button
                      type="button"
                      onClick={() => setIsInviteDialogOpen(false)}
                      aria-label="Close"
                      className="grid size-9 place-items-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-6 text-center space-y-4">
                    <p className="text-xs text-slate-400">
                      Share this code with teammates
                    </p>

                    <div className="mx-auto w-48 h-16 flex flex-col items-center justify-center rounded-lg border border-white/15 bg-gradient-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#D6FFF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                      <p className="text-[9px] uppercase tracking-[0.28em] text-slate-400">Room code</p>
                      <p className="mt-0.5 break-all font-mono text-base font-bold tracking-widest text-[#D6FFF6]">
                        {room.joinCode ?? 'Room code unavailable'}
                      </p>
                    </div>

                    {copyStatus === 'unavailable' ? (
                      <p className="text-sm text-amber-200">Room code could not be copied automatically.</p>
                    ) : null}

                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={handleCopyRoomCode}
                        disabled={!room.joinCode}
                        className="inline-flex items-center justify-center gap-2 cursor-pointer rounded-full border-2 border-white/10 bg-[#18181B]/90 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-150 hover:border-white/20 active:bg-[#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {copyStatus === 'copied' ? (
                          <Check size={14} aria-hidden="true" />
                        ) : (
                          <Copy size={14} aria-hidden="true" />
                        )}
                        {copyStatus === 'copied' ? 'Copied' : 'Copy code'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </TooltipProvider>
  )
}
