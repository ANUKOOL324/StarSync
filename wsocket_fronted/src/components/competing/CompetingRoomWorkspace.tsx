import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  MoreVertical,
  MessageSquare,
  Play,
  RotateCcw,
  ScrollText,
  Trophy,
  Users,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { PanelImperativeHandle } from 'react-resizable-panels'

import { useAuth } from '../../hooks/useAuth'
import { useChatSocket } from '../../hooks/useChatSocket'
import { roomMemberService } from '../../services/roomMemberService'
import type { ChatRoom, RoomMember } from '../../types/chat'
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
  DialogDescription,
  DialogFooter,
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

type SampleSubmission = {
  id: string
  submittedAt: string
  username: string
  problem: string
  language: string
  verdict: 'Accepted' | 'Wrong Answer' | 'Compilation Error'
  runtime: string
  memory: string
  code: string
  isOwnSubmission: boolean
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
        <span className="font-mono text-sm tabular-nums text-white font-semibold">{clockLabel}</span>
        {sessionStatus === 'waiting' ? (
          <span className="text-xs text-slate-500">Waiting</span>
        ) : null}
        {isEnded ? <span className="text-xs text-amber-200">Ended</span> : null}
      </div>
    )
  }

  return (
    <div
      className={[
        'flex items-center gap-0.5 rounded-lg border bg-white/[0.035] p-0.5',
        isRunning
          ? 'border-emerald-300/25'
          : isEnded
            ? 'border-amber-300/25'
            : 'border-white/10',
      ].join(' ')}
    >
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
        className="size-8 shrink-0"
        onClick={onReset}
        disabled={!isRunning && !isEnded}
        aria-label="Reset session timer"
      >
        <RotateCcw size={14} aria-hidden="true" />
      </Button>
    </div>
  )
}

const mockProblems: MockProblem[] = [
  {
    id: 'p1',
    shortLabel: 'P1',
    title: 'Merging Two Sorted Arrays',
    difficulty: 'MEDIUM',
    topics: ['Array', 'Two Pointers'],
    description: 'Given two sorted arrays, merge them into one sorted array in non-decreasing order.',
    inputExplanation: 'The first line contains both array lengths. The following lines contain the sorted values.',
    outputExplanation: 'Print every value from the merged sorted array on one line.',
    constraints: [
      '1 <= test cases <= 100',
      '1 <= first array length, second array length <= 50',
      'Both input arrays are sorted in non-decreasing order',
    ],
    sampleInput: '5 2\n1 2 3 4 6\n7 8',
    sampleOutput: '1 2 3 4 6 7 8',
    hints: [
      'Keep one pointer for each array.',
      'Move the pointer that currently has the smaller value.',
      'Append the remaining values after one array ends.',
    ],
  },
  {
    id: 'p2',
    shortLabel: 'P2',
    title: 'Two Sum Sorted',
    difficulty: 'MEDIUM',
    topics: ['Array', 'Two Pointers'],
    description: 'Find two positions in a sorted array whose values add up to the requested target.',
    inputExplanation: 'The first line contains the target. The second line contains the sorted array.',
    outputExplanation: 'Print the one-based positions of the matching pair.',
    constraints: [
      '2 <= array length <= 100000',
      '-1000000000 <= value, target <= 1000000000',
      'Exactly one valid pair exists',
    ],
    sampleInput: '9\n2 4 5 7 11',
    sampleOutput: '1 4',
    hints: [
      'Start with one pointer at each end.',
      'Move the left pointer when the sum is too small.',
    ],
  },
  {
    id: 'p3',
    shortLabel: 'P3',
    title: 'Remove Duplicates',
    difficulty: 'EASY',
    topics: ['Array'],
    description: 'Remove duplicate values from a sorted array in place and return the number of unique values.',
    inputExplanation: 'The input contains the array length followed by the sorted values.',
    outputExplanation: 'Print the unique count and the unique prefix of the array.',
    constraints: [
      '1 <= array length <= 30000',
      '-100 <= value <= 100',
      'The array is sorted in non-decreasing order',
    ],
    sampleInput: '7\n1 1 2 2 3 3 4',
    sampleOutput: '4\n1 2 3 4',
    hints: [
      'Use one pointer for the next unique position.',
      'Only write a value when it differs from the previous unique value.',
    ],
  },
  {
    id: 'p4',
    shortLabel: 'P4',
    title: 'Container With Most Water',
    difficulty: 'MEDIUM',
    topics: ['Array', 'Two Pointers'],
    description: 'Choose two vertical lines that hold the greatest possible amount of water between them.',
    inputExplanation: 'The input contains the number of lines followed by their heights.',
    outputExplanation: 'Print the maximum container area.',
    constraints: [
      '2 <= height count <= 100000',
      '0 <= height <= 10000',
      'Use 64-bit arithmetic when calculating area',
    ],
    sampleInput: '9\n1 8 6 2 5 4 8 3 7',
    sampleOutput: '49',
    hints: [
      'Start with the widest possible container.',
      'Move the pointer at the shorter line.',
    ],
  },
]

const sampleSubmissions: SampleSubmission[] = [
  {
    id: '1042',
    submittedAt: '03:21 AM',
    username: 'You',
    problem: 'A',
    language: 'JavaScript',
    verdict: 'Accepted',
    runtime: '52 ms',
    memory: '41.8 MB',
    code: `function mergeSortedArrays(firstArray, secondArray) {
  const merged = []
  let firstIndex = 0
  let secondIndex = 0

  while (firstIndex < firstArray.length && secondIndex < secondArray.length) {
    if (firstArray[firstIndex] <= secondArray[secondIndex]) {
      merged.push(firstArray[firstIndex])
      firstIndex += 1
    } else {
      merged.push(secondArray[secondIndex])
      secondIndex += 1
    }
  }

  return merged
    .concat(firstArray.slice(firstIndex))
    .concat(secondArray.slice(secondIndex))
}`,
    isOwnSubmission: true,
  },
  {
    id: '1039',
    submittedAt: '03:18 AM',
    username: 'Maya',
    problem: 'A',
    language: 'Python',
    verdict: 'Wrong Answer',
    runtime: '-',
    memory: '-',
    code: `def merge_sorted_arrays(first_array, second_array):
    return sorted(first_array + second_array)`,
    isOwnSubmission: false,
  },
  {
    id: '1035',
    submittedAt: '03:12 AM',
    username: 'Rahul',
    problem: 'A',
    language: 'C++',
    verdict: 'Compilation Error',
    runtime: '-',
    memory: '-',
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> result;
    return 0;
}`,
    isOwnSubmission: false,
  },
]

const difficultyClassName: Record<string, string> = {
  EASY: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  MEDIUM: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  HARD: 'border-red-300/25 bg-red-400/10 text-red-200',
}

const submissionStatusClassName: Record<SampleSubmission['verdict'], string> = {
  Accepted: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  'Wrong Answer': 'border-red-300/25 bg-red-400/10 text-red-200',
  'Compilation Error': 'border-amber-300/25 bg-amber-400/10 text-amber-200',
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
  sessionStatus,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  isCollapsed = false,
  onExpandRequest,
}: {
  sessionStatus: SessionStatus
  activeTab?: ProblemPanelTab
  onActiveTabChange?: (tab: ProblemPanelTab) => void
  isCollapsed?: boolean
  onExpandRequest?: (tab: ProblemPanelTab) => void
}) {
  const [selectedProblemId, setSelectedProblemId] = useState(mockProblems[0].id)
  const [selectedSubmission, setSelectedSubmission] = useState<SampleSubmission | null>(null)
  const [internalActiveTab, setInternalActiveTab] = useState<ProblemPanelTab>('problem')
  const activeTab = controlledActiveTab ?? internalActiveTab

  const setActiveTab = (nextTab: ProblemPanelTab) => {
    if (onActiveTabChange) {
      onActiveTabChange(nextTab)
      return
    }

    setInternalActiveTab(nextTab)
  }

  const selectedProblemIndex = mockProblems.findIndex((problem) => problem.id === selectedProblemId)
  const selectedProblem = mockProblems[selectedProblemIndex] ?? mockProblems[0]
  const isSubmissionCodeBlocked =
    sessionStatus === 'running' && selectedSubmission && !selectedSubmission.isOwnSubmission

  const selectProblemAtIndex = (nextIndex: number) => {
    const nextProblem = mockProblems[nextIndex]

    if (nextProblem) {
      setSelectedProblemId(nextProblem.id)
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
                aria-label={`Problem ${selectedProblemIndex + 1} of ${mockProblems.length}`}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={selectedProblemIndex === 0}
                  onClick={() => selectProblemAtIndex(selectedProblemIndex - 1)}
                  aria-label="Previous problem"
                  className="size-8 shrink-0 border border-white/10 text-slate-300 bg-transparent hover:!border-blue-500/40 hover:!bg-transparent hover:!text-white hover:shadow-[0_0_12px_rgba(59,130,246,0.25)] active:!border-blue-500/50 active:shadow-[0_0_14px_rgba(59,130,246,0.35)] transition-all duration-200 cursor-pointer"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                </Button>
                {mockProblems.map((problem) => {
                  const isSelected = problem.id === selectedProblem.id
                  
                  
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
                      onClick={() => setSelectedProblemId(problem.id)}
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
                  disabled={selectedProblemIndex === mockProblems.length - 1}
                  onClick={() => selectProblemAtIndex(selectedProblemIndex + 1)}
                  aria-label="Next problem"
                  className="size-8 shrink-0 border border-white/10 text-slate-300 bg-transparent hover:!border-blue-500/40 hover:!bg-transparent hover:!text-white hover:shadow-[0_0_12px_rgba(59,130,246,0.25)] active:!border-blue-500/50 active:shadow-[0_0_14px_rgba(59,130,246,0.35)] transition-all duration-200 cursor-pointer"
                >
                  <ChevronRight size={14} aria-hidden="true" />
                </Button>
              </div>
            </section>

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
            </div>
          </TabsContent>

          <TabsContent value="submissions" className="m-0 min-w-0 max-w-full overflow-hidden p-4 sm:p-5">
            <div className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
              <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                <h2 className="text-lg font-semibold text-white">Submissions</h2>
                <p className="mt-1 text-sm text-slate-400">Shared mock verdicts for this practice session.</p>
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
                    {sampleSubmissions.map((submission) => (
                      <TableRow key={submission.id} className="border-white/8 hover:bg-white/[0.035]">
                        <TableCell className="px-3">
                          <button
                            type="button"
                            className="font-mono text-sm font-semibold text-[#7FFFE0] underline-offset-4 hover:underline cursor-pointer"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            {submission.id}
                          </button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 text-slate-400">
                          {submission.submittedAt}
                        </TableCell>
                        <TableCell className="px-3 text-slate-200">{submission.username}</TableCell>
                        <TableCell className="px-3 text-slate-200">{submission.problem}</TableCell>
                        <TableCell className="px-3 text-slate-300">{submission.language}</TableCell>
                        <TableCell className="px-3">
                          <Badge className={submissionStatusClassName[submission.verdict]}>
                            {submission.verdict}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 text-slate-400">{submission.runtime}</TableCell>
                        <TableCell className="whitespace-nowrap px-3 text-slate-400">{submission.memory}</TableCell>
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
            <DialogTitle>Submission #{selectedSubmission?.id}</DialogTitle>
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
                  <span className="text-white/20">·</span>
                  <Badge className={submissionStatusClassName[selectedSubmission.verdict]}>
                    {selectedSubmission.verdict}
                  </Badge>
                  <span className="text-white/20">·</span>
                  <span className="text-sm text-slate-400">{selectedSubmission.runtime}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-sm text-slate-400">{selectedSubmission.memory}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ['User', selectedSubmission.username],
                    ['Problem', selectedSubmission.problem],
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
                        navigator.clipboard.writeText(selectedSubmission.code)
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
          <Badge className="shrink-0 border !border-blue-500/30 bg-blue-500/10 text-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
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
              {onlineCount} online · {members.length || 1} total
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
  connectionStatus,
  room,
}: {
  connectionStatus: 'connecting' | 'online' | 'offline'
  room: ChatRoom
}) {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050911]">
      <Suspense fallback={<EditorSkeleton />}>
        <LazyCodeEditorWorkspace
          activeCollaborators={[]}
          connectionStatus={connectionStatus}
          room={room}
          toolbarMode="competing"
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
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('waiting')
  const [remainingSeconds, setRemainingSeconds] = useState(toSessionSeconds(initialDraft.hours, initialDraft.minutes))
  const [problemPanelTab, setProblemPanelTab] = useState<ProblemPanelTab>('problem')
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
    sendMessage,
    sendStopTyping,
    sendTyping,
    typingUsers,
  } = useChatSocket(room.id, user?.id)

  const currentMember = members.find((member) => member.id === user?.id)
  const canManageTimer =
    room.adminId === user?.id || currentMember?.role === 'ADMIN' || (!room.adminId && members.length === 0)

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
          return 0
        }

        return currentSeconds - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(countdownInterval)
    }
  }, [sessionStatus])

  const handleStartTimer = () => {
    const nextSeconds = toSessionSeconds(draftHours, draftMinutes)

    if (nextSeconds <= 0) {
      return
    }

    setRemainingSeconds(nextSeconds)
    setSessionStatus('running')
  }

  const handleResetTimer = () => {
    setSessionStatus('waiting')
    setRemainingSeconds(toSessionSeconds(draftHours, draftMinutes))
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
              onClick={() => navigate('/dashboard')}
              className="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-slate-400 transition-all duration-200 hover:!border-[#18D6A3]/40 hover:shadow-[0_0_12px_rgba(24,214,163,0.25)] active:!border-[#18D6A3]/60 active:shadow-[0_0_14px_rgba(24,214,163,0.35)] cursor-pointer"
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
              remainingSeconds={remainingSeconds}
              sessionStatus={sessionStatus}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden lg:inline-flex"
              onClick={() => {
                setCopyStatus('idle')
                setIsInviteDialogOpen(true)
              }}
            >
              Invite
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Open room menu">
                  <MoreVertical size={15} aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-white/10 bg-[#111113] text-slate-200">
                <DropdownMenuItem
                  onSelect={() => {
                    setCopyStatus('idle')
                    setIsInviteDialogOpen(true)
                  }}
                >
                  Copy room code
                </DropdownMenuItem>
                <DropdownMenuItem>View session details</DropdownMenuItem>
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
                  sessionStatus={sessionStatus}
                  activeTab={problemPanelTab}
                  onActiveTabChange={setProblemPanelTab}
                  isCollapsed={isProblemPanelCollapsed}
                  onExpandRequest={handleProblemPanelExpand}
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
              <EditorPanel connectionStatus={connectionStatus} room={room} />
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

        <Tabs defaultValue="problem" className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-x-hidden overflow-y-hidden p-3 xl:hidden">
          <TabsList variant="competing" className="grid h-9 w-full grid-cols-3">
            <TabsTrigger value="problem" className="border border-transparent data-[state=active]:!border-blue-500/40 data-[state=active]:!bg-blue-500/12 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all duration-150">Problem</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:!bg-emerald-500/12 data-[state=active]:!text-white">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="problem" className="m-0 h-full min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <ProblemPanel sessionStatus={sessionStatus} />
          </TabsContent>

          <TabsContent value="editor" className="m-0 h-full min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <EditorPanel connectionStatus={connectionStatus} room={room} />
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
            className="border-white/10 bg-black/70 text-white shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <DialogHeader>
              <DialogTitle>Invite teammates</DialogTitle>
              <DialogDescription className="text-slate-400">
                Share this code with teammates so they can join this competing room.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Room code</p>
              <p className="mt-2 break-all font-mono text-lg font-semibold text-[#D6FFF6]">
                {room.joinCode ?? 'Room code unavailable'}
              </p>
            </div>

            {copyStatus === 'unavailable' ? (
              <p className="text-sm text-amber-200">Room code could not be copied automatically.</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleCopyRoomCode} disabled={!room.joinCode}>
                {copyStatus === 'copied' ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <Copy size={16} aria-hidden="true" />
                )}
                {copyStatus === 'copied' ? 'Copied' : 'Copy code'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </TooltipProvider>
  )
}

