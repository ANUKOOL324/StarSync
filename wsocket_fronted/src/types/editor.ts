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
