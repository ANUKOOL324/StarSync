import type { OnMount } from '@monaco-editor/react'

import type { EditorLanguage } from '../../types/editor'

export type MonacoEditorInstance = Parameters<OnMount>[0]
export type MonacoEditorModel = ReturnType<MonacoEditorInstance['getModel']>

export type EditorToolbarMode = 'collaborative' | 'competing'

export const DEFAULT_EDITOR_LANGUAGE: EditorLanguage = 'javascript'

export const starterCodeByLanguage: Record<EditorLanguage, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello from C\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++" << endl;\n    return 0;\n}\n',
  javascript: 'console.log("Hello from JavaScript");\n',
  typescript: 'const message: string = "Hello from TypeScript";\nconsole.log(message);\n',
  python: 'print("Hello from Python")\n',
}

const supportedLanguages = new Set<EditorLanguage>(['c', 'cpp', 'javascript', 'typescript', 'python'])

export const isSupportedEditorLanguage = (language: string): language is EditorLanguage => {
  return supportedLanguages.has(language as EditorLanguage)
}

const CURSOR_COLORS = [
  '#18D6A3', '#F59E0B', '#8B5CF6', '#EF4444',
  '#3B82F6', '#EC4899', '#10B981', '#F97316',
]

export const getUserColor = (seed: string): string => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

export const getEditorLiveblocksRoomId = (roomId: string) => {
  return `editor:${roomId}`
}
