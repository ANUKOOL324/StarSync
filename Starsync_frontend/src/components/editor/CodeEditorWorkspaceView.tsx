import type { OnMount } from '@monaco-editor/react'

import type { CodeRunResult, EditorLanguage, RoomProblemRunResult, RoomProblemSubmitResult, SaveStatus } from '../../types/editor'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { CollaborativeCodeEditor } from './CollaborativeCodeEditor'
import { EditorOutputPanel } from './EditorOutputPanel'
import { EditorSkeleton } from './EditorSkeleton'
import { EditorStatusBar } from './EditorStatusBar'
import { EditorToolbar } from './EditorToolbar'

type CodeEditorWorkspaceViewProps = {
  code: string
  connectionStatus: 'connecting' | 'online' | 'offline'
  editorError: string | null
  isLoading: boolean
  isRunning: boolean
  isSubmitting: boolean
  language: EditorLanguage
  lastSavedAt: Date | null
  onClearOutput: () => void
  onCodeChange: (code: string) => void
  onEditorMount: OnMount
  onLanguageChange: (language: EditorLanguage) => void
  onReset: () => void
  onRetryLoad: () => void
  onRunCode: () => void
  onSave: () => void
  onStdinChange: (stdin: string) => void
  onSubmit: () => void
  roomId: string
  runError: string | null
  runResult: CodeRunResult | null
  saveStatus: SaveStatus
  stdin: string
  submitResult: RoomProblemSubmitResult | null
  testcaseResult: RoomProblemRunResult | null
  toolbarMode: 'collaborative' | 'competing'
}

export function CodeEditorWorkspaceView({
  code,
  connectionStatus,
  editorError,
  isLoading,
  isRunning,
  isSubmitting,
  language,
  lastSavedAt,
  onClearOutput,
  onCodeChange,
  onEditorMount,
  onLanguageChange,
  onReset,
  onRetryLoad,
  onRunCode,
  onSave,
  onStdinChange,
  onSubmit,
  roomId,
  runError,
  runResult,
  saveStatus,
  stdin,
  submitResult,
  testcaseResult,
  toolbarMode,
}: CodeEditorWorkspaceViewProps) {
  if (isLoading) return <EditorSkeleton />

  if (editorError && !code) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-300/20 bg-red-950/15 p-5 text-center shadow-xl shadow-black/20 backdrop-blur-md">
          <p className="text-base font-semibold text-white">Could not load editor document</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">The editor could not open this room document. Try again after the room connection is ready.</p>
          <button type="button" onClick={onRetryLoad} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-[#18D6A3]/25 bg-[#18D6A3]/12 px-4 text-sm font-semibold text-[#7FFFE0] transition hover:bg-[#18D6A3]/18">Try again</button>
        </div>
      </div>
    )
  }

  const isBusy = isRunning || isSubmitting
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      {editorError ? <div className="shrink-0 border-b border-red-300/20 bg-red-950/20 px-4 py-2 text-sm text-red-100">{editorError}</div> : null}
      <EditorToolbar
        disabled={connectionStatus === 'offline'}
        isRunning={isBusy}
        canRun={Boolean(code.trim())}
        language={language}
        lastSavedAt={lastSavedAt}
        onClearOutput={onClearOutput}
        onLanguageChange={onLanguageChange}
        onReset={onReset}
        onRunCode={onRunCode}
        onSave={onSave}
        onSubmit={onSubmit}
        saveStatus={saveStatus}
        toolbarMode={toolbarMode}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <ResizablePanelGroup direction="vertical" className="h-full min-h-0 w-full min-w-0 overflow-hidden" key={`editor-layout-${roomId}`}>
          <ResizablePanel id="code-editor-panel" defaultSize="70%" minSize="10%" collapsible={false} className="min-h-0 min-w-0 overflow-hidden">
            <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
              <CollaborativeCodeEditor key={roomId} code={code} isLoading={isLoading} language={language} onChange={onCodeChange} onMount={onEditorMount} />
            </div>
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className={
              toolbarMode === 'competing'
                ? 'z-20 h-1.5 border-y border-white/5 bg-[#1a1a1c] transition hover:bg-[#2a2a2e] active:bg-[#303033] focus-visible:ring-1 focus-visible:ring-white/15 focus-visible:ring-offset-0'
                : 'z-20 h-1.5 border-y border-white/5 bg-white/[0.025] transition hover:bg-[#57F1DB]/12'
            }
          />
          <ResizablePanel id="code-output-panel" defaultSize="30%" minSize="10%" maxSize="90%" collapsible={false} className="min-h-0 min-w-0 overflow-hidden">
            <div className="h-full min-h-0 w-full min-w-0 overflow-hidden">
              <EditorOutputPanel error={runError} fillAvailableHeight isRunning={isBusy} result={runResult} testcaseResult={testcaseResult} submitResult={submitResult} stdin={stdin} tabVariant={toolbarMode === 'competing' ? 'competing' : 'default'} onStdinChange={onStdinChange} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <EditorStatusBar
        connectionStatus={connectionStatus}
        hideConnectionStatus={toolbarMode === 'competing'}
        language={language}
        remoteUserName={null}
        saveStatus={saveStatus}
      />
    </div>
  )
}
