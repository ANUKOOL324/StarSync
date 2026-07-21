export type SessionStatus = 'waiting' | 'running' | 'ended'
export type ProblemPanelTab = 'problem' | 'submissions' | 'editorial'
export type SessionPanelTab = 'chat' | 'players'
export type CompetingProblem = {
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
export type CopyStatus = 'idle' | 'copied' | 'unavailable'
