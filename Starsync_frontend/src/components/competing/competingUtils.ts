import type { AssignedRoomProblem, ChatRoom } from '../../types/chat'
import type { CompetingProblem } from './competingTypes'

export const formatSessionClock = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':')
}

export const splitDurationMinutes = (totalMinutes: number) => {
  const safeMinutes = Math.max(0, totalMinutes)

  return {
    hours: Math.floor(safeMinutes / 60),
    minutes: safeMinutes % 60,
  }
}


export const getFirstVisibleExample = (problem: AssignedRoomProblem) => {
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

export const mapAssignedProblemToPanelProblem = (problem: AssignedRoomProblem): CompetingProblem => {
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

export const toSessionSeconds = (hours: number, minutes: number) => {
  return Math.max(0, hours) * 3600 + Math.max(0, minutes) * 60
}

export const clampTimerPart = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) {
    return min
  }

  return Math.min(max, Math.max(min, value))
}

export const difficultyClassName: Record<string, string> = {
  EASY: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  MEDIUM: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  HARD: 'border-red-300/25 bg-red-400/10 text-red-200',
}

const leetcodeFailureClassName = 'border-[#ef4743]/25 bg-[#ef4743]/10 text-[#ef4743]'

export const submissionStatusClassName: Record<string, string> = {
  ACCEPTED: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  WRONG_ANSWER: leetcodeFailureClassName,
  COMPILATION_ERROR: leetcodeFailureClassName,
  RUNTIME_ERROR: leetcodeFailureClassName,
  TIME_LIMIT_EXCEEDED: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  INTERNAL_ERROR: 'border-slate-300/25 bg-slate-400/10 text-slate-200',
  Accepted: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  'Wrong Answer': leetcodeFailureClassName,
  'Compilation Error': leetcodeFailureClassName,
  'Runtime Error': leetcodeFailureClassName,
}

export const formatSubmissionStatus = (status: string) => {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const getSubmissionStatusClassName = (status: string) => {
  if (submissionStatusClassName[status]) {
    return submissionStatusClassName[status]
  }

  const normalizedStatus = status.toUpperCase().replace(/\s+/g, '_')

  if (submissionStatusClassName[normalizedStatus]) {
    return submissionStatusClassName[normalizedStatus]
  }

  if (['WRONG_ANSWER', 'COMPILATION_ERROR', 'RUNTIME_ERROR'].includes(normalizedStatus)) {
    return leetcodeFailureClassName
  }

  return 'border-slate-300/25 bg-slate-400/10 text-slate-200'
}

export const formatDifficulty = (difficulty?: ChatRoom['difficulty']) => {
  if (!difficulty) {
    return 'Medium'
  }

  return difficulty[0] + difficulty.slice(1).toLowerCase()
}

export const getOnlineMemberIds = (onlineUsers: Array<{ id: string }>) => {
  return new Set(onlineUsers.map((onlineUser) => onlineUser.id))
}
