import { lazy, Suspense } from 'react'
import type { ChatRoom } from '../../types/chat'
import { EditorSkeleton } from '../editor/EditorSkeleton'

const LazyCodeEditorWorkspace = lazy(() =>
  import('../editor/CodeEditorWorkspace').then((module) => ({
    default: module.CodeEditorWorkspace,
  })),
)

export function CompetingEditorPanel({
  competingProblemId,
  connectionStatus,
  room,
  onSubmitSuccess,
}: {
  competingProblemId?: string | null
  connectionStatus: 'connecting' | 'online' | 'offline'
  room: ChatRoom
  onSubmitSuccess?: () => void
}) {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050911]">
      <Suspense fallback={<EditorSkeleton />}>
        <LazyCodeEditorWorkspace
          activeCollaborators={[]}
          connectionStatus={connectionStatus}
          room={room}
          toolbarMode="competing"
          competingProblemId={competingProblemId}
          onSubmitSuccess={onSubmitSuccess}
        />
      </Suspense>
    </main>
  )
}
