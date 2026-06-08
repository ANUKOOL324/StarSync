import { LiveblocksProvider, RoomProvider, useRoom } from '@liveblocks/react'
import { getYjsProviderForRoom } from '@liveblocks/yjs'
import type { OnMount } from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MonacoBinding } from 'y-monaco'
import type * as Y from 'yjs'

import { editorService } from '../../services/editorService'
import { liveblocksService } from '../../services/liveblocksService'
import type { ChatRoom } from '../../types/chat'
import type { CodeRunResult, EditorLanguage, EditorPresenceUser, SaveStatus } from '../../types/editor'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { CollaborativeCodeEditor } from './CollaborativeCodeEditor'
import { EditorOutputPanel } from './EditorOutputPanel'
import { EditorSkeleton } from './EditorSkeleton'
import { EditorStatusBar } from './EditorStatusBar'
import { EditorToolbar } from './EditorToolbar'

type CodeEditorWorkspaceProps = {
  activeCollaborators: EditorPresenceUser[]
  connectionStatus: 'connecting' | 'online' | 'offline'
  room: ChatRoom
}

type CodeEditorWorkspaceContentProps = CodeEditorWorkspaceProps

type MonacoEditorInstance = Parameters<OnMount>[0]
type MonacoEditorModel = ReturnType<MonacoEditorInstance['getModel']>
type SharedEditorText = Y.Text

const starterCodeByLanguage: Record<EditorLanguage, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello from C\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++" << endl;\n    return 0;\n}\n',
  javascript: 'console.log("Hello from JavaScript");\n',
  typescript: 'const message: string = "Hello from TypeScript";\nconsole.log(message);\n',
  python: 'print("Hello from Python")\n',
}

const supportedLanguages = new Set<EditorLanguage>(['c', 'cpp', 'javascript', 'typescript', 'python'])

const getEditorLiveblocksRoomId = (roomId: string) => {
  return `editor:${roomId}`
}

const isSupportedEditorLanguage = (language: string): language is EditorLanguage => {
  return supportedLanguages.has(language as EditorLanguage)
}

const replaceYTextContent = (yText: SharedEditorText, content: string) => {
  yText.doc?.transact(() => {
    yText.delete(0, yText.length)
    yText.insert(0, content)
  })
}

export function CodeEditorWorkspace(props: CodeEditorWorkspaceProps) {
  const editorRoomId = getEditorLiveblocksRoomId(props.room.id)

  return (
    <LiveblocksProvider
      authEndpoint={async (requestedRoom) => {
        return liveblocksService.authorizeRoom(requestedRoom ?? editorRoomId)
      }}
    >
      <RoomProvider id={editorRoomId} initialPresence={{}}>
        <CodeEditorWorkspaceContent key={props.room.id} {...props} />
      </RoomProvider>
    </LiveblocksProvider>
  )
}

function CodeEditorWorkspaceContent({
  activeCollaborators,
  connectionStatus,
  room,
}: CodeEditorWorkspaceContentProps) {
  const liveblocksRoom = useRoom()
  const [code, setCode] = useState('')
  const [documentTitle, setDocumentTitle] = useState('main')
  const [editorError, setEditorError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [language, setLanguage] = useState<EditorLanguage>('javascript')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [stdin, setStdin] = useState('')
  const [loadRetryCount, setLoadRetryCount] = useState(0)
  const [monacoEditor, setMonacoEditor] = useState<MonacoEditorInstance | null>(null)

  const loadedDocumentContentRef = useRef('')
  const yTextRef = useRef<SharedEditorText | null>(null)

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

      loadedDocumentContentRef.current = documentContent
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
    if (isLoading) return

    const editor = monacoEditor
    const model = editor?.getModel()

    if (!editor || !model) return

    let binding: MonacoBinding | null = null
    let hasCreatedBinding = false
    let shouldIgnoreChanges = false

    const provider = getYjsProviderForRoom(liveblocksRoom, undefined, true)
    const yDocument = provider.getYDoc()
    const yText = yDocument.getText('monaco')
    yTextRef.current = yText

    const handleYTextChange = () => {
      if (shouldIgnoreChanges) return

      const nextCode = yText.toString()
      setCode(nextCode)
      setSaveStatus('unsaved')
    }

    const createBindingAfterFirstSync = () => {
      if (hasCreatedBinding) return

      hasCreatedBinding = true

      const savedSnapshot = loadedDocumentContentRef.current

      if (yText.length === 0 && savedSnapshot.length > 0) {
        shouldIgnoreChanges = true
        replaceYTextContent(yText, savedSnapshot)
        shouldIgnoreChanges = false
      }

      const sharedCode = yText.toString()

      if (sharedCode !== model.getValue()) {
        shouldIgnoreChanges = true
        model.setValue(sharedCode)
        shouldIgnoreChanges = false
      }

      setCode(sharedCode)

      binding = new MonacoBinding(yText, model as NonNullable<MonacoEditorModel>, new Set([editor]))
      yText.observe(handleYTextChange)
    }

    const handleProviderSync = (isSynced: boolean) => {
      if (isSynced) {
        createBindingAfterFirstSync()
      }
    }

    provider.on('sync', handleProviderSync)

    if (provider.synced) {
      createBindingAfterFirstSync()
    }

    return () => {
      provider.off('sync', handleProviderSync)
      yText.unobserve(handleYTextChange)
      binding?.destroy()
      provider.destroy()

      if (yTextRef.current === yText) {
        yTextRef.current = null
      }
    }
  }, [isLoading, liveblocksRoom, monacoEditor, room.id])

  useEffect(() => {
    const documentHasLocalChanges = saveStatus === 'unsaved' || saveStatus === 'syncing'

    if (isLoading || !documentHasLocalChanges) return

    const saveTimer = window.setTimeout(() => {
      void saveDocument()
    }, 1500)

    return () => window.clearTimeout(saveTimer)
  }, [isLoading, saveDocument, saveStatus])

  const handleEditorMount: OnMount = (editor) => {
    setMonacoEditor(editor)
  }

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode)
    setSaveStatus('unsaved')
  }

  const handleLanguageChange = (nextLanguage: EditorLanguage) => {
    const nextCode = code || starterCodeByLanguage[nextLanguage]

    setLanguage(nextLanguage)
    setCode(nextCode)
    setSaveStatus('unsaved')

    const sharedText = yTextRef.current

    if (sharedText) {
      replaceYTextContent(sharedText, nextCode)
    }
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
        key={room.id}
        code={code}
        isLoading={isLoading}
        language={language}
        onChange={handleCodeChange}
        onMount={handleEditorMount}
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
        remoteUserName={null}
        saveStatus={saveStatus}
      />
    </div>
  )
}
