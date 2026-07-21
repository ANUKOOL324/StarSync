import { LiveblocksProvider, RoomProvider, useOthers, useRoom, useUpdateMyPresence } from '@liveblocks/react'
import { getYjsProviderForRoom } from '@liveblocks/yjs'
import type { OnMount } from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MonacoBinding } from 'y-monaco'
import type * as Y from 'yjs'

import { useAuth } from '../../hooks/useAuth'
import { editorService } from '../../services/editorService'
import { liveblocksService } from '../../services/liveblocksService'
import type { ChatRoom } from '../../types/chat'
import type { CodeRunResult, EditorLanguage, EditorPresenceUser, RoomProblemRunResult, RoomProblemSubmitResult, SaveStatus } from '../../types/editor'

import { CodeEditorWorkspaceView } from './CodeEditorWorkspaceView'

type CodeEditorWorkspaceProps = {
  activeCollaborators: EditorPresenceUser[]
  connectionStatus: 'connecting' | 'online' | 'offline'
  room: ChatRoom
  toolbarMode?: 'collaborative' | 'competing'
  competingProblemId?: string | null
  onSubmitSuccess?: () => void
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


const CURSOR_COLORS = [
  '#18D6A3', '#F59E0B', '#8B5CF6', '#EF4444',
  '#3B82F6', '#EC4899', '#10B981', '#F97316',
]
const getUserColor = (seed: string): string => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

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
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <CodeEditorWorkspaceContent key={props.room.id} {...props} />
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

function CodeEditorWorkspaceContent({
  connectionStatus,
  room,
  toolbarMode = 'collaborative',
  competingProblemId = null,
  onSubmitSuccess,
}: CodeEditorWorkspaceContentProps) {
  const liveblocksRoom = useRoom()
  const { user } = useAuth()
  const [code, setCode] = useState('')

  const [editorError, setEditorError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [language, setLanguage] = useState<EditorLanguage>('javascript')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null)
  const [testcaseRunResult, setTestcaseRunResult] = useState<RoomProblemRunResult | null>(null)
  const [testcaseSubmitResult, setTestcaseSubmitResult] = useState<RoomProblemSubmitResult | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [stdin, setStdin] = useState('')
  const codeIsEmpty = code.trim().length === 0
  const [loadRetryCount, setLoadRetryCount] = useState(0)
  const [monacoEditor, setMonacoEditor] = useState<MonacoEditorInstance | null>(null)

  const loadedDocumentContentRef = useRef('')
  const yTextRef = useRef<SharedEditorText | null>(null)
  
  const cursorDecorationsRef = useRef<string[]>([])
  const cursorStyleTagRef = useRef<HTMLStyleElement | null>(null)

  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateMyPresence = useUpdateMyPresence() as (data: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const others = useOthers() as ReadonlyArray<any>

  const documentKey = `competing_draft_${room.id}_${competingProblemId || 'default'}`

  const saveDocument = useCallback(async () => {
    setSaveStatus('saving')

    if (toolbarMode === 'competing') {
      try {
        localStorage.setItem(documentKey, JSON.stringify({ code, language, updatedAt: new Date().toISOString() }))
        setLastSavedAt(new Date())
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
        setEditorError('Editor document could not be saved locally.')
      }
      return
    }

    try {
      const document = await editorService.saveDocument(room.id, code, language)

      setLastSavedAt(new Date(document.updatedAt))
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
      setEditorError('Editor document could not be saved.')
    }
  }, [code, language, room.id, toolbarMode, documentKey])

  const loadDocument = useCallback(async (isCurrentRequest: () => boolean) => {
    setIsLoading(true)
    setEditorError(null)

    if (toolbarMode === 'competing') {
      if (!isCurrentRequest()) return
      try {
        const saved = localStorage.getItem(documentKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          const docLanguage = isSupportedEditorLanguage(parsed.language) ? parsed.language as EditorLanguage : 'javascript'
          const docContent = parsed.code || starterCodeByLanguage[docLanguage]
          loadedDocumentContentRef.current = docContent
          setLanguage(docLanguage)
          setCode(docContent)
          setLastSavedAt(new Date(parsed.updatedAt))
          setSaveStatus('saved')
        } else {
          const docLanguage = 'javascript'
          const docContent = starterCodeByLanguage[docLanguage]
          loadedDocumentContentRef.current = docContent
          setLanguage(docLanguage)
          setCode(docContent)
          setSaveStatus('saved')
        }
      } catch {
        setEditorError('Could not load editor document')
        setSaveStatus('error')
      } finally {
        setIsLoading(false)
      }
      return
    }

    try {
      const document = await editorService.getDocument(room.id)

      if (!isCurrentRequest()) return

      const documentLanguage = isSupportedEditorLanguage(document.language)
        ? document.language
        : 'javascript'
      const documentContent = document.content || starterCodeByLanguage[documentLanguage]

      loadedDocumentContentRef.current = documentContent

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
  }, [room.id, toolbarMode, documentKey])

  useEffect(() => {
    let isCurrentRequest = true

    void loadDocument(() => isCurrentRequest)

    return () => {
      isCurrentRequest = false
    }
  }, [loadDocument, loadRetryCount])

  useEffect(() => {
    if (isLoading || toolbarMode === 'competing') return

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
  }, [isLoading, liveblocksRoom, monacoEditor, room.id, toolbarMode])

  
  useEffect(() => {
    const editor = monacoEditor
    if (!editor || !user || toolbarMode === 'competing') return

    
    updateMyPresence({
      user: {
        name: user.username,
        color: getUserColor(user.id ?? user.username ?? 'default'),
      },
      cursor: null,
    })

    const disposable = editor.onDidChangeCursorSelection(() => {
      const model = editor.getModel()
      if (!model) return
      const sel = editor.getSelection()
      if (!sel) return
      updateMyPresence({
        cursor: {
          anchor: model.getOffsetAt(sel.getStartPosition()),
          head: model.getOffsetAt(sel.getEndPosition()),
        },
      })
    })

    return () => disposable.dispose()
  }, [monacoEditor, updateMyPresence, user, toolbarMode])

  
  useEffect(() => {
    const editor = monacoEditor
    const model = editor?.getModel()
    if (!editor || !model || toolbarMode === 'competing') return

    
    if (!cursorStyleTagRef.current) {
      const el = document.createElement('style')
      el.id = 'collab-cursor-styles'
      document.head.appendChild(el)
      cursorStyleTagRef.current = el
    }

    const cssRules: string[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newDecorations: any[] = []

    others.forEach((other) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const presence = other.presence as any
      const cursor = presence?.cursor
      if (!cursor) return

      const cid = other.connectionId as number
      const remoteUser = presence?.user
      const color: string = remoteUser?.color ?? getUserColor(String(cid))
      const name: string = remoteUser?.name ?? `User ${cid}`
      
      const safeName = name.replace(/"/g, '').replace(/\\/g, '')

      cssRules.push(
        `.yRemoteSelection-${cid}{background-color:${color}33;}` +
        `.yRemoteSelectionHead-${cid}{border-color:${color};border-left:2px solid ${color};}` +
        `.yRemoteSelectionHead-${cid}::after{` +
          `content:"${safeName}";` +
          `background:${color};color:#05080a;` +
          `position:absolute;top:-1.5em;left:-2px;` +
          `padding:1px 6px;border-radius:4px 4px 4px 0;` +
          `font-size:11px;font-weight:700;white-space:nowrap;pointer-events:none;z-index:100;` +
        `}`
      )

      try {
        const anchorPos = model.getPositionAt(cursor.anchor as number)
        const headPos = model.getPositionAt(cursor.head as number)
        const isForward =
          anchorPos.lineNumber < headPos.lineNumber ||
          (anchorPos.lineNumber === headPos.lineNumber && anchorPos.column <= headPos.column)
        const start = isForward ? anchorPos : headPos
        const end = isForward ? headPos : anchorPos

        newDecorations.push({
          range: { startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column },
          options: {
            className: `yRemoteSelection yRemoteSelection-${cid}`,
            afterContentClassName: isForward ? `yRemoteSelectionHead yRemoteSelectionHead-${cid}` : undefined,
            beforeContentClassName: isForward ? undefined : `yRemoteSelectionHead yRemoteSelectionHead-${cid}`,
          },
        })
      } catch {
        void 0;
      }
    })

    
    if (cursorStyleTagRef.current) {
      cursorStyleTagRef.current.textContent = cssRules.join('\n')
    }

    
    cursorDecorationsRef.current = editor.deltaDecorations(cursorDecorationsRef.current, newDecorations)

    return () => {
      
    }
  }, [monacoEditor, others, toolbarMode])

  
  useEffect(() => {
    return () => {
      cursorStyleTagRef.current?.remove()
      cursorStyleTagRef.current = null
    }
  }, [])

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

    if (toolbarMode === 'competing') {
      return
    }

    const sharedText = yTextRef.current

    if (sharedText) {
      replaceYTextContent(sharedText, nextCode)
    }
  }

  const handleResetCode = () => {
    const starterCode = starterCodeByLanguage[language]

    monacoEditor?.setValue(starterCode)
    setCode(starterCode)
    setRunError(null)
    setRunResult(null)
    setTestcaseRunResult(null)
    setTestcaseSubmitResult(null)
    setSaveStatus('unsaved')

    if (toolbarMode === 'competing') {
      return
    }

    const sharedText = yTextRef.current

    if (sharedText) {
      replaceYTextContent(sharedText, starterCode)
    }
  }

  const handleSubmit = async () => {
    if (codeIsEmpty || isSubmitting) return

    setIsSubmitting(true)
    setRunError(null)
    setRunResult(null)
    setTestcaseRunResult(null)
    setTestcaseSubmitResult(null)

    try {
      if (!competingProblemId) {
        throw new Error('Select a problem before submitting code')
      }

      const result = await editorService.submitProblemCode(room.id, competingProblemId, language, code)
      setTestcaseSubmitResult(result)

      if (onSubmitSuccess) {
        onSubmitSuccess()
      }
    } catch (error) {
      const safeMessage = error instanceof Error ? error.message : 'Could not submit code'
      setRunError(safeMessage)
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleRunCode = async () => {
    if (codeIsEmpty || isRunning) return

    setIsRunning(true)
    setRunError(null)
    setRunResult(null)
    setTestcaseRunResult(null)
    setTestcaseSubmitResult(null)

    try {
      if (toolbarMode === 'competing') {
        if (!competingProblemId) {
          throw new Error('Select a problem before running code')
        }

        const result = await editorService.runProblemVisibleTestcases(room.id, competingProblemId, language, code)
        setTestcaseRunResult(result)
        return
      }

      const result = await editorService.runCode(room.id, language, code, stdin)
      setRunResult(result)
    } catch (error) {
      const safeMessage = error instanceof Error ? error.message : 'Could not run code'
      setRunError(safeMessage)
    } finally {
      setIsRunning(false)
    }
  }
  useEffect(() => {
    setRunError(null)
    setRunResult(null)
    setTestcaseRunResult(null)
    setTestcaseSubmitResult(null)
  }, [competingProblemId])

  return (
    <CodeEditorWorkspaceView
      code={code}
      connectionStatus={connectionStatus}
      editorError={editorError}
      isLoading={isLoading}
      isRunning={isRunning}
      isSubmitting={isSubmitting}
      language={language}
      lastSavedAt={lastSavedAt}
      onClearOutput={() => {
        setRunError(null)
        setRunResult(null)
        setTestcaseRunResult(null)
      }}
      onCodeChange={handleCodeChange}
      onEditorMount={handleEditorMount}
      onLanguageChange={handleLanguageChange}
      onReset={handleResetCode}
      onRetryLoad={() => setLoadRetryCount((currentCount) => currentCount + 1)}
      onRunCode={handleRunCode}
      onSave={() => void saveDocument()}
      onStdinChange={setStdin}
      onSubmit={handleSubmit}
      roomId={room.id}
      runError={runError}
      runResult={runResult}
      saveStatus={saveStatus}
      stdin={stdin}
      submitResult={testcaseSubmitResult}
      testcaseResult={testcaseRunResult}
      toolbarMode={toolbarMode}
    />
  )
}
