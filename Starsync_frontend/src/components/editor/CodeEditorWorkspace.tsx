import { LiveblocksProvider, RoomProvider } from '@liveblocks/react'
import type { OnMount } from '@monaco-editor/react'
import { useState } from 'react'

import { liveblocksService } from '../../services/liveblocksService'
import type { ChatRoom } from '../../types/chat'
import type { EditorLanguage, EditorPresenceUser } from '../../types/editor'

import { CodeEditorWorkspaceView } from './CodeEditorWorkspaceView'
import type { EditorToolbarMode, MonacoEditorInstance } from './editorConfig'
import { getEditorLiveblocksRoomId, starterCodeByLanguage } from './editorConfig'
import { useCodeExecution } from './hooks/useCodeExecution'
import { useEditorDocument } from './hooks/useEditorDocument'
import { useEditorPresence } from './hooks/useEditorPresence'
import { useYjsEditorCollaboration } from './hooks/useYjsEditorCollaboration'

type CodeEditorWorkspaceProps = {
  activeCollaborators: EditorPresenceUser[]
  connectionStatus: 'connecting' | 'online' | 'offline'
  room: ChatRoom
  toolbarMode?: EditorToolbarMode
  competingProblemId?: string | null
  onSubmitSuccess?: () => void
}

type CodeEditorWorkspaceContentProps = CodeEditorWorkspaceProps

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

/**
 * Wires the editor's four concerns together and hands the result to the view:
 * the document (code, language, saving), collaborative editing over Yjs,
 * collaborator cursors, and running or submitting code.
 */
function CodeEditorWorkspaceContent({
  connectionStatus,
  room,
  toolbarMode = 'collaborative',
  competingProblemId = null,
  onSubmitSuccess,
}: CodeEditorWorkspaceContentProps) {
  const [monacoEditor, setMonacoEditor] = useState<MonacoEditorInstance | null>(null)

  const editorDocument = useEditorDocument({
    competingProblemId,
    roomId: room.id,
    toolbarMode,
  })

  const collaboration = useYjsEditorCollaboration({
    isLoading: editorDocument.isLoading,
    languageRef: editorDocument.languageRef,
    loadedContentRef: editorDocument.loadedContentRef,
    loadedLanguageRef: editorDocument.loadedLanguageRef,
    markUnsaved: editorDocument.markUnsaved,
    monacoEditor,
    roomId: room.id,
    setCode: editorDocument.setCode,
    setLanguage: editorDocument.setLanguage,
    toolbarMode,
  })

  useEditorPresence({ monacoEditor, toolbarMode })

  const execution = useCodeExecution({
    code: editorDocument.code,
    competingProblemId,
    language: editorDocument.language,
    onSubmitSuccess,
    roomId: room.id,
    toolbarMode,
  })

  const handleEditorMount: OnMount = (editor) => {
    setMonacoEditor(editor)
  }

  const handleCodeChange = (nextCode: string) => {
    editorDocument.setCode(nextCode)
    editorDocument.markUnsaved()
  }

  const handleLanguageChange = (nextLanguage: EditorLanguage) => {
    if (toolbarMode === 'competing') {
      const nextCode = editorDocument.code || starterCodeByLanguage[nextLanguage]

      editorDocument.setLanguage(nextLanguage)
      editorDocument.setCode(nextCode)
      editorDocument.markUnsaved()
      return
    }

    editorDocument.setLanguage(nextLanguage)
    editorDocument.markUnsaved()
    collaboration.publishSharedLanguage(nextLanguage)
  }

  const handleResetCode = () => {
    const starterCode = starterCodeByLanguage[editorDocument.language]

    monacoEditor?.setValue(starterCode)
    editorDocument.setCode(starterCode)
    execution.clearAllResults()
    editorDocument.markUnsaved()

    // No-op for competing rooms, which never hold a shared document.
    collaboration.replaceSharedCode(starterCode)
  }

  return (
    <CodeEditorWorkspaceView
      code={editorDocument.code}
      connectionStatus={connectionStatus}
      editorError={editorDocument.editorError}
      isLoading={editorDocument.isLoading}
      isRunning={execution.isRunning}
      isSubmitting={execution.isSubmitting}
      language={editorDocument.language}
      lastSavedAt={editorDocument.lastSavedAt}
      onClearOutput={execution.clearOutput}
      onCodeChange={handleCodeChange}
      onEditorMount={handleEditorMount}
      onLanguageChange={handleLanguageChange}
      onReset={handleResetCode}
      onRetryLoad={editorDocument.retryLoad}
      onRunCode={execution.runCode}
      onSave={() => void editorDocument.saveDocument()}
      onStdinChange={execution.setStdin}
      onSubmit={execution.submitCode}
      roomId={room.id}
      runError={execution.runError}
      runResult={execution.runResult}
      saveStatus={editorDocument.saveStatus}
      stdin={execution.stdin}
      submitResult={execution.submitResult}
      testcaseResult={execution.testcaseResult}
      toolbarMode={toolbarMode}
    />
  )
}
