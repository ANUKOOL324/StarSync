import type { ChatUser } from './chat'

export type EditorLanguage = 'c' | 'cpp' | 'javascript' | 'typescript' | 'python'

export type CodeDocument = {
  id: string
  roomId: string
  title: string
  language: EditorLanguage
  content: string
  createdAt: string
  updatedAt: string
}

export type CodeRunResult = {
  language: string
  version: string
  stdout: string
  stderr: string
  compileOutput: string
  output: string
  exitCode: number | null
  signal: string | null
  executionTimeMs?: number
  status: 'success' | 'error'
}

export type EditorSyncEvent = {
  roomId: string
  content: string
  language: EditorLanguage
  updatedBy: Pick<ChatUser, 'id' | 'username'>
}

export type EditorPresenceUser = Pick<ChatUser, 'id' | 'username' | 'email'>

export type SaveStatus = 'idle' | 'unsaved' | 'syncing' | 'saving' | 'saved' | 'error' | 'remote'
export type ProblemTestcaseRunResult = {
  testcaseId: string
  order: number
  input: string
  expectedOutput: string
  actualOutput: string
  passed: boolean
  error?: string
}

export type RoomProblemRunResult = {
  problemId: string
  language: EditorLanguage
  passedCount: number
  totalCount: number
  results: ProblemTestcaseRunResult[]
}

export type ProblemTestcaseSubmitResult = {
  testcaseId: string
  order: number
  isHidden: boolean
  passed: boolean
  input?: string
  expectedOutput?: string
  actualOutput?: string
  error?: string
}

export type RoomProblemSubmitResult = {
  submissionId: string
  problemId: string
  language: EditorLanguage
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'INTERNAL_ERROR'
  passedCount: number
  totalCount: number
  runtimeMs?: number
  memoryKb?: number
  isLate: boolean
  results: ProblemTestcaseSubmitResult[]
}

export type SubmissionHistoryItem = {
  id: string
  problemId: string
  problemLabel?: string
  userId: string
  username: string
  code: string | null
  language: string
  status: string
  runtimeMs?: number
  memoryKb?: number
  passedCount: number
  totalCount: number
  isLate: boolean
  submittedAt: string
  canViewCode: boolean
}