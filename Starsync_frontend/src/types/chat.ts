export type ChatUser = {
  id: string
  username: string
  email: string
}

export type ChatMessage = {
  id?: string
  clientMessageId?: string
  mess: string
  content?: string
  senderId: string
  roomId?: string
  createdAt?: string
  isOwn?: boolean
  status?: 'sending' | 'sent' | 'failed'
  sender?: ChatUser
}

export type ChatRoom = {
  id: string
  name: string
  slug: string
  joinCode?: string
  maxMembers?: number | null
  description: string
  type?: 'GROUP' | 'DM'
  purpose?: 'COLLABORATIVE' | 'COMPETING'
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | null
  topics?: string[]
  durationMinutes?: number | null
  sessionStatus?: 'WAITING' | 'RUNNING' | 'ENDED'
  sessionStartedAt?: string | null
  createdAt?: string
  adminId?: string
  admin?: ChatUser
  otherUser?: ChatUser | null
  lastMessage?: ChatMessage | null
  unreadCount?: number
  isActive?: boolean
  _count?: {
    members?: number
    messages: number
  }
}

export type OnlineUser = {
  id: string
  username: string
  email: string
}

export type RoomMember = ChatUser & {
  role: 'ADMIN' | 'MEMBER'
  joinedAt: string
  isOnline?: boolean
}

export type TypingUser = {
  id: string
  username: string
}
export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export type ProblemExample = {
  input: string
  output: string
  explanation?: string
}

export type VisibleTestCase = {
  id: string
  input: string
  expectedOutput: string
  order: number
}

export type AssignedRoomProblem = {
  id: string
  roomProblemId: string
  slug: string
  order: number
  shortLabel: string
  points: number
  title: string
  difficulty: ProblemDifficulty
  topics: string[]
  description: string
  inputFormat: string | null
  outputFormat: string | null
  constraints: string[]
  examples: ProblemExample[] | null
  starterCode: Record<string, string> | null
  editorial: string | null
  visibleTestCases: VisibleTestCase[]
}

export type RoomTimerUpdateEvent = {
  type: 'ROOM_TIMER_UPDATED'
  payload: {
    roomId: string
    sessionStatus: 'WAITING' | 'RUNNING' | 'ENDED'
    sessionStartedAt: string | null
    durationMinutes: number | null
  }
}

export type RoomSubmissionCreatedEvent = {
  type: 'ROOM_SUBMISSION_CREATED'
  payload: {
    roomId: string
    problemId: string
    submissionId: string
    userId: string
    username: string
    status: string
    language: string
    passedCount: number
    totalCount: number
    runtimeMs?: number
    submittedAt: string
  }
}
