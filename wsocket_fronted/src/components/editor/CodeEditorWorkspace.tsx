import { useCallback, useEffect, useRef, useState } from 'react'

import { editorService } from '../../services/editorService'
import type { AuthUser } from '../../types/auth'
import type { ChatRoom } from '../../types/chat'
import type {
  CodeRunResult,
  EditorLanguage,
  EditorPresenceUser,
  EditorSyncEvent,
  SaveStatus,
} from '../../types/editor'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { CollaborativeCodeEditor } from './CollaborativeCodeEditor'
import { EditorOutputPanel } from './EditorOutputPanel'
import { EditorSkeleton } from './EditorSkeleton'
import { EditorStatusBar } from './EditorStatusBar'
import { EditorToolbar } from './EditorToolbar'

type CodeEditorWorkspaceProps = {
  activeCollaborators: EditorPresenceUser[]
  connectionStatus: 'connecting' | 'online' | 'offline'
  currentUser: AuthUser | null
  lastEditorSync: EditorSyncEvent | null
  room: ChatRoom
  onEditorChange: (content: string, language: EditorLanguage) => void
}

const starterCodeByLanguage: Record<EditorLanguage, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello from C\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++" << endl;\n    return 0;\n}\n',
  javascript: 'console.log("Hello from JavaScript");\n',
  typescript: 'const message: string = "Hello from TypeScript";\nconsole.log(message);\n',
  python: 'print("Hello from Python")\n',
}

const supportedLanguages = new Set<EditorLanguage>(['c', 'cpp', 'javascript', 'typescript', 'python'])

const isSupportedEditorLanguage = (language: string): language is EditorLanguage => {
  return supportedLanguages.has(language as EditorLanguage)
}

export function CodeEditorWorkspace({
  activeCollaborators,
  connectionStatus,
  currentUser,
  lastEditorSync,
  room,
  onEditorChange,
}: CodeEditorWorkspaceProps) {
  const [code, setCode] = useState('')
  const [documentTitle, setDocumentTitle] = useState('main')
  const [editorError, setEditorError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [language, setLanguage] = useState<EditorLanguage>('javascript')
  const [lastRemoteUserName, setLastRemoteUserName] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [stdin, setStdin] = useState('')
  const [loadRetryCount, setLoadRetryCount] = useState(0)
  const suppressNextEmitRef = useRef(false)
  const syncTimerRef = useRef<number | null>(null)

  const roomDisplay = getRoomDisplayInfo(room)
  const codeIsEmpty = code.trim().length === 0

  const saveDocument = useCallback(async () => {
    setSaveStatus('saving')

    try {
      const document = await editorService.saveDocument(room.id, code, language)

      setLastSavedAt(new Date(document.updatedAt))
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
      setEditorError('Editor document could not be saved.')
    }
  }, [code, language, room.id])

  const loadDocument = useCallback(async (isCurrentRequest: () => boolean) => {
    setIsLoading(true)
    setEditorError(null)

    try {
      const document = await editorService.getDocument(room.id)

      if (!isCurrentRequest()) return

      const documentLanguage = isSupportedEditorLanguage(document.language)
        ? document.language
        : 'javascript'
      const documentContent = document.content || starterCodeByLanguage[documentLanguage]

      setDocumentTitle(document.title)
      setLanguage(documentLanguage)
      setCode(documentContent)
      setLastSavedAt(new Date(document.updatedAt))
      setSaveStatus('saved')
    } catch {
      if (isCurrentRequest()) {
        setEditorError('Could not load editor document')
        setSaveStatus('error')
      }
    } finally {
      if (isCurrentRequest()) {
        setIsLoading(false)
      }
    }
  }, [room.id])

  useEffect(() => {
    let isCurrentRequest = true

    void loadDocument(() => isCurrentRequest)

    return () => {
      isCurrentRequest = false
    }
  }, [loadDocument, loadRetryCount])

  useEffect(() => {
    if (!lastEditorSync || lastEditorSync.roomId !== room.id) return
    if (lastEditorSync.updatedBy.id === currentUser?.id) return

    suppressNextEmitRef.current = true
    setCode(lastEditorSync.content)
    setLanguage(lastEditorSync.language)
    setLastRemoteUserName(lastEditorSync.updatedBy.username)
    setSaveStatus('remote')
  }, [currentUser?.id, lastEditorSync, room.id])

  useEffect(() => {
    const documentHasLocalChanges = saveStatus === 'unsaved' || saveStatus === 'syncing'

    if (isLoading || !documentHasLocalChanges) return

    const saveTimer = window.setTimeout(() => {
      void saveDocument()
    }, 1500)

    return () => window.clearTimeout(saveTimer)
  }, [isLoading, saveDocument, saveStatus])

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current)
      }
    }
  }, [])

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode)

    if (suppressNextEmitRef.current) {
      suppressNextEmitRef.current = false
      return
    }

    setSaveStatus('unsaved')

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current)
    }

    syncTimerRef.current = window.setTimeout(() => {
      setSaveStatus('syncing')
      onEditorChange(nextCode, language)
    }, 500)
  }

  const handleLanguageChange = (nextLanguage: EditorLanguage) => {
    const nextCode = code || starterCodeByLanguage[nextLanguage]

    setLanguage(nextLanguage)
    setCode(nextCode)
    setSaveStatus('unsaved')
    onEditorChange(nextCode, nextLanguage)
  }

  const handleRunCode = async () => {
    if (codeIsEmpty || isRunning) return

    setIsRunning(true)
    setRunError(null)
    setRunResult(null)

    try {
      const result = await editorService.runCode(room.id, language, code, stdin)
      setRunResult(result)
    } catch (error) {
      const safeMessage = error instanceof Error ? error.message : 'Could not run code'
      setRunError(safeMessage)
    } finally {
      setIsRunning(false)
    }
  }

  if (isLoading) {
    return <EditorSkeleton />
  }

  if (editorError && !code) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-300/20 bg-red-950/15 p-5 text-center shadow-xl shadow-black/20 backdrop-blur-md">
          <p className="text-base font-semibold text-white">Could not load editor document</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The editor could not open this room document. Try again after the room connection is ready.
          </p>
          <button
            type="button"
            onClick={() => setLoadRetryCount((currentCount) => currentCount + 1)}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-[#18D6A3]/25 bg-[#18D6A3]/12 px-4 text-sm font-semibold text-[#7FFFE0] transition hover:bg-[#18D6A3]/18"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {editorError ? (
        <div className="shrink-0 border-b border-red-300/20 bg-red-950/20 px-4 py-2 text-sm text-red-100">
          {editorError}
        </div>
      ) : null}

      <EditorToolbar
        disabled={connectionStatus === 'offline'}
        documentTitle={documentTitle}
        isRunning={isRunning}
        canRun={!codeIsEmpty}
        activeCollaborators={activeCollaborators}
        language={language}
        lastSavedAt={lastSavedAt}
        onClearOutput={() => {
          setRunError(null)
          setRunResult(null)
        }}
        onLanguageChange={handleLanguageChange}
        onRunCode={handleRunCode}
        onSave={() => void saveDocument()}
        roomLabel={roomDisplay.displayName}
        saveStatus={saveStatus}
      />

      <CollaborativeCodeEditor
        code={code}
        isLoading={isLoading}
        language={language}
        onChange={handleCodeChange}
      />

      <EditorOutputPanel
        error={runError}
        isRunning={isRunning}
        result={runResult}
        stdin={stdin}
        onStdinChange={setStdin}
      />

      <EditorStatusBar
        connectionStatus={connectionStatus}
        language={language}
        remoteUserName={lastRemoteUserName}
        saveStatus={saveStatus}
      />
    </div>
  )
}
