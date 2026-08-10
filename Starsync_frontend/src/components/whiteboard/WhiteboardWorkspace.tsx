import { LiveblocksProvider, RoomProvider, useMutation, useOthers, useStorage, useStorageRoot, useUpdateMyPresence } from '@liveblocks/react'
import type { JsonObject } from '@liveblocks/client'
import { useEffect, useMemo, useRef } from 'react'
import { createTLStore, getSnapshot, loadSnapshot, Tldraw } from 'tldraw'
import type { TLEditorSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'

import { liveblocksService } from '../../services/liveblocksService'
import type { ChatRoom } from '../../types/chat'
import { WhiteboardSkeleton } from './WhiteboardSkeleton'

export type WhiteboardCollaborator = {
  id: string
  username: string
  email: string
}

type WhiteboardWorkspaceProps = {
  room: ChatRoom
  currentUser?: { id: string; username: string; email: string } | null
  onCollaboratorsChange?: (collaborators: WhiteboardCollaborator[]) => void
}

const getWhiteboardRoomId = (roomId: string) => {
  return `whiteboard:${roomId}`
}

const stringifySnapshot = (snapshot: unknown) => {
  return JSON.stringify(snapshot)
}

type StoredBoardSnapshot = {
  document: TLEditorSnapshot['document']
}

const extractDocumentFromStored = (stored: JsonObject | null): TLEditorSnapshot['document'] | null => {
  if (!stored || typeof stored !== 'object') {
    return null
  }

  const record = stored as Record<string, unknown>

  if (record.document && typeof record.document === 'object') {
    return record.document as TLEditorSnapshot['document']
  }

  return null
}

const createStoredBoardSnapshot = (store: ReturnType<typeof createTLStore>): StoredBoardSnapshot => {
  const { document } = getSnapshot(store)
  return { document }
}


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

type WhiteboardCanvasProps = {
  room: ChatRoom
  currentUser?: { id: string; username: string; email: string } | null
  onCollaboratorsChange?: (collaborators: WhiteboardCollaborator[]) => void
}

function WhiteboardCanvas({ room, currentUser, onCollaboratorsChange }: WhiteboardCanvasProps) {
  const store = useMemo(() => createTLStore({ id: room.id }), [room.id])
  const [storageRoot] = useStorageRoot()
  const boardSnapshot = useStorage((root) => root.boardSnapshot as JsonObject | null)
  const others = useOthers()
  const saveTimerRef = useRef<number | null>(null)
  const isApplyingRemoteSnapshotRef = useRef(false)
  const lastSavedSnapshotRef = useRef<string | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateMyPresence = useUpdateMyPresence() as (data: any) => void

  const saveBoardSnapshot = useMutation(
    ({ storage }, nextSnapshot: JsonObject) => {
      
      
      
      storage.set('boardSnapshot', nextSnapshot)
    },
    [],
  )

  const collaborators = useMemo(() => {
    const list = others.map((user) => ({
      id: String(user.connectionId),
      username: String(user.info?.name ?? 'User'),
      email: String(user.info?.email ?? user.connectionId),
    }))

    if (currentUser) {
      list.unshift({
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
      })
    }

    return list
  }, [others, currentUser])

  useEffect(() => {
    onCollaboratorsChange?.(collaborators)
  }, [collaborators, onCollaboratorsChange])

  
  useEffect(() => {
    if (!currentUser) return
    updateMyPresence({
      user: {
        name: currentUser.username,
        color: getUserColor(currentUser.id ?? currentUser.username),
      },
      cursor: null,
    })
  }, [currentUser, updateMyPresence])

  useEffect(() => {
    if (!storageRoot) {
      return
    }

    const removeStoreListener = store.listen(
      () => {
        if (isApplyingRemoteSnapshotRef.current) {
          return
        }

        if (saveTimerRef.current) {
          window.clearTimeout(saveTimerRef.current)
        }

        saveTimerRef.current = window.setTimeout(() => {
          const nextSnapshot = createStoredBoardSnapshot(store)
          const nextSnapshotText = stringifySnapshot(nextSnapshot)

          lastSavedSnapshotRef.current = nextSnapshotText
          saveBoardSnapshot(nextSnapshot as unknown as JsonObject)
        }, 500)
      },
      { source: 'user', scope: 'document' },
    )

    return () => {
      removeStoreListener()

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [saveBoardSnapshot, storageRoot, store])

  useEffect(() => {
    const documentSnapshot = extractDocumentFromStored(boardSnapshot)

    if (!documentSnapshot) {
      return
    }

    const remoteSnapshotText = stringifySnapshot({ document: documentSnapshot })

    if (remoteSnapshotText === lastSavedSnapshotRef.current) {
      return
    }

    isApplyingRemoteSnapshotRef.current = true
    loadSnapshot(store, { document: documentSnapshot })
    lastSavedSnapshotRef.current = remoteSnapshotText

    queueMicrotask(() => {
      isApplyingRemoteSnapshotRef.current = false
    })
  }, [boardSnapshot, store])

  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = canvasContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    updateMyPresence({
      cursor: {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      },
    })
  }

  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null })
  }

  if (!storageRoot) {
    return <WhiteboardSkeleton />
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#05080A]">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(24,214,163,0.28)_1px,transparent_0)] [background-size:18px_18px]" />
        <div
          ref={canvasContainerRef}
          className="absolute inset-3 overflow-hidden rounded-2xl border border-white/10 bg-[#F8FAFC] shadow-2xl shadow-black/25"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <Tldraw store={store} />

          
          {others.map((other) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const presence = other.presence as any
            const cursor = presence?.cursor
            if (!cursor || cursor.x == null || cursor.y == null) return null

            const remoteUser = presence?.user
            const name: string = remoteUser?.name ?? `User ${other.connectionId}`
            const color: string = remoteUser?.color ?? getUserColor(String(other.connectionId))

            return (
              <div
                key={other.connectionId}
                className="pointer-events-none absolute"
                style={{
                  left: `${cursor.x as number}%`,
                  top: `${cursor.y as number}%`,
                  zIndex: 50,
                  transform: 'translate(0, 0)',
                }}
              >
                
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                  <path
                    d="M0 0L0 14L4 10L7 17L9 16L6 9L11 9Z"
                    fill={color}
                    stroke="#05080a"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </svg>
                
                <span
                  className="absolute left-3 top-3 rounded rounded-tl-none px-1.5 py-0.5 text-[11px] font-bold leading-4 whitespace-nowrap shadow-sm"
                  style={{ background: color, color: '#05080a' }}
                >
                  {name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function WhiteboardWorkspace({ room, currentUser, onCollaboratorsChange }: WhiteboardWorkspaceProps) {
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
        <WhiteboardCanvas room={room} currentUser={currentUser} onCollaboratorsChange={onCollaboratorsChange} />
      </RoomProvider>
    </LiveblocksProvider>
  )
}
