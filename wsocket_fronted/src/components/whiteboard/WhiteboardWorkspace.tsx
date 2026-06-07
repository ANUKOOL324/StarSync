import { LiveblocksProvider, RoomProvider, useMutation, useOthers, useStatus, useStorage, useStorageRoot } from '@liveblocks/react'
import type { JsonObject } from '@liveblocks/client'
import { useEffect, useMemo, useRef } from 'react'
import { createTLStore, getSnapshot, loadSnapshot, Tldraw } from 'tldraw'
import type { TLEditorSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'

import { liveblocksService } from '../../services/liveblocksService'
import type { ChatRoom } from '../../types/chat'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { Avatar } from '../ui/Avatar'
import { WhiteboardSkeleton } from './WhiteboardSkeleton'

type WhiteboardWorkspaceProps = {
  room: ChatRoom
}

const getWhiteboardRoomId = (roomId: string) => {
  return `whiteboard:${roomId}`
}

const stringifySnapshot = (snapshot: unknown) => {
  return JSON.stringify(snapshot)
}

function WhiteboardCanvas({ room }: WhiteboardWorkspaceProps) {
  const roomDisplay = getRoomDisplayInfo(room)
  const store = useMemo(() => createTLStore({ id: room.id }), [room.id])
  const [storageRoot] = useStorageRoot()
  const boardSnapshot = useStorage((root) => root.boardSnapshot as JsonObject | null)
  const others = useOthers()
  const liveblocksStatus = useStatus()
  const saveTimerRef = useRef<number | null>(null)
  const isApplyingRemoteSnapshotRef = useRef(false)
  const lastSavedSnapshotRef = useRef<string | null>(null)

  const saveBoardSnapshot = useMutation(
    ({ storage }, nextSnapshot: JsonObject) => {
      // The whiteboard is stored as one tldraw snapshot in Liveblocks Storage.
      // This is intentionally simple for Phase 1. Later we can move to a
      // deeper shape-level sync model if the board becomes larger.
      storage.set('boardSnapshot', nextSnapshot)
    },
    [],
  )

  useEffect(() => {
    if (!storageRoot) {
      return
    }

    const removeStoreListener = store.listen(() => {
      if (isApplyingRemoteSnapshotRef.current) {
        return
      }

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = window.setTimeout(() => {
        const nextSnapshot = getSnapshot(store)
        const nextSnapshotText = stringifySnapshot(nextSnapshot)

        lastSavedSnapshotRef.current = nextSnapshotText
        saveBoardSnapshot(nextSnapshot as unknown as JsonObject)
      }, 500)
    })

    return () => {
      removeStoreListener()

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [saveBoardSnapshot, storageRoot, store])

  useEffect(() => {
    if (!boardSnapshot) {
      return
    }

    const remoteSnapshotText = stringifySnapshot(boardSnapshot)

    if (remoteSnapshotText === lastSavedSnapshotRef.current) {
      return
    }

    isApplyingRemoteSnapshotRef.current = true
    loadSnapshot(store, boardSnapshot as unknown as TLEditorSnapshot, {
      forceOverwriteSessionState: true,
    })
    lastSavedSnapshotRef.current = remoteSnapshotText

    queueMicrotask(() => {
      isApplyingRemoteSnapshotRef.current = false
    })
  }, [boardSnapshot, store])

  if (!storageRoot) {
    return <WhiteboardSkeleton />
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#05080A]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#09090B]/88 px-4 py-3 backdrop-blur-xl">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Shared Whiteboard</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {roomDisplay.displayName} canvas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[#18D6A3]/20 bg-[#18D6A3]/10 px-3 py-1 text-xs font-medium text-[#7FFFE0]">
            {liveblocksStatus === 'connected' ? 'Live' : 'Connecting'}
          </span>
          <div className="flex -space-x-2">
            {others.slice(0, 4).map((user) => (
              <div key={user.connectionId} className="rounded-full border-2 border-[#09090B]">
                <Avatar
                  name={String(user.info?.name ?? 'User')}
                  seed={String(user.info?.email ?? user.connectionId)}
                  size="sm"
                />
              </div>
            ))}
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-400">
            {others.length + 1} active
          </span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(24,214,163,0.28)_1px,transparent_0)] [background-size:18px_18px]" />
        <div className="absolute inset-3 overflow-hidden rounded-2xl border border-white/10 bg-[#F8FAFC] shadow-2xl shadow-black/25">
          <Tldraw store={store} />
        </div>
      </div>
    </div>
  )
}

export function WhiteboardWorkspace({ room }: WhiteboardWorkspaceProps) {
  const whiteboardRoomId = getWhiteboardRoomId(room.id)

  return (
    <LiveblocksProvider
      authEndpoint={async (liveblocksRoom) => {
        return liveblocksService.authorizeRoom(liveblocksRoom ?? whiteboardRoomId)
      }}
    >
      <RoomProvider
        id={whiteboardRoomId}
        initialPresence={{}}
        initialStorage={{ boardSnapshot: null }}
      >
        <WhiteboardCanvas room={room} />
      </RoomProvider>
    </LiveblocksProvider>
  )
}
