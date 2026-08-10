import { useCallback, useEffect, useRef, useState } from 'react'

import { dmService } from '../services/dmService'
import { inboxSocketService } from '../services/inboxSocketService'
import { getRoomJoinErrorMessage, roomService } from '../services/roomService'
import type { ChatMessage, ChatRoom, InboxMessageEvent } from '../types/chat'
import type { CreateRoomPayload, UpdateRoomPayload } from '../services/roomService'

const toIsoString = (value: string | Date) => {
  return typeof value === 'string' ? value : value.toISOString()
}

const applyInboxUpdate = (rooms: ChatRoom[], payload: InboxMessageEvent) => {
  const createdAt = toIsoString(payload.createdAt)

  return rooms.map((room) => {
    if (room.id !== payload.roomId) {
      return room
    }

    const previousMessageTotal = room._count?.messages ?? 0
    const unreadFromPayload = payload.unreadCount ?? 0
    const unreadCount =
      unreadFromPayload > 0
        ? unreadFromPayload
        : payload.totalMessageCount > previousMessageTotal
          ? Math.max(payload.totalMessageCount - previousMessageTotal, 1)
          : unreadFromPayload

    return {
      ...room,
      unreadCount,
      lastActivityAt: createdAt,
      lastMessage:
        payload.roomType === 'DM'
          ? {
              id: payload.messageId,
              mess: payload.content,
              content: payload.content,
              senderId: payload.senderId,
              roomId: payload.roomId,
              createdAt,
              sender: payload.sender,
            }
          : room.lastMessage,
      _count: {
        ...room._count,
        messages: payload.totalMessageCount,
      },
    }
  })
}

const applyActiveRoomMessageUpdate = (rooms: ChatRoom[], message: ChatMessage, isDm: boolean) => {
  const roomId = message.roomId

  if (!roomId || !message.id) {
    return rooms
  }

  const createdAt = toIsoString(message.createdAt ?? new Date().toISOString())

  return rooms.map((room) => {
    if (room.id !== roomId) {
      return room
    }

    return {
      ...room,
      unreadCount: 0,
      lastActivityAt: createdAt,
      ...(isDm
        ? {
            lastMessage: {
              id: message.id,
              mess: message.mess ?? message.content ?? '',
              content: message.content ?? message.mess,
              senderId: message.senderId,
              roomId,
              createdAt,
              sender: message.sender,
            },
          }
        : {}),
    }
  })
}

const isActiveRoomMatch = (room: ChatRoom, activeRoomKey?: string) => {
  if (!activeRoomKey) {
    return false
  }

  return room.id === activeRoomKey || room.slug === activeRoomKey
}

const applyActiveRoomUnreadZero = (
  rooms: ChatRoom[],
  activeRoomKey?: string,
  isChatVisible = false,
) => {
  if (!activeRoomKey || !isChatVisible) {
    return rooms
  }

  return rooms.map((room) =>
    isActiveRoomMatch(room, activeRoomKey) ? { ...room, unreadCount: 0 } : room,
  )
}

const mergeIncomingRooms = (incoming: ChatRoom[], existing: ChatRoom[]) => {
  const existingById = new Map(existing.map((room) => [room.id, room]))

  return incoming.map((room) => {
    const previous = existingById.get(room.id)

    if (!previous) {
      return room
    }

    const previousActivityTime = previous.lastActivityAt ? Date.parse(previous.lastActivityAt) : 0
    const serverActivityTime = room.lastActivityAt ? Date.parse(room.lastActivityAt) : 0
    const localActivityIsNewer = previousActivityTime > serverActivityTime

    if (!localActivityIsNewer && (!previous.lastMessage || room.lastMessage)) {
      return room
    }

    return {
      ...room,
      lastMessage: localActivityIsNewer
        ? previous.lastMessage ?? room.lastMessage
        : room.lastMessage ?? previous.lastMessage,
      lastActivityAt: localActivityIsNewer
        ? previous.lastActivityAt ?? room.lastActivityAt
        : room.lastActivityAt ?? previous.lastActivityAt,
    }
  })
}

const promoteRoom = (rooms: ChatRoom[], roomId: string) => {
  const room = rooms.find((item) => item.id === roomId)

  if (!room) {
    return rooms
  }

  return [room, ...rooms.filter((item) => item.id !== roomId)]
}

const UNKNOWN_DM_MAX_ATTEMPTS = 3
const UNKNOWN_DM_RETRY_DELAYS_MS = [400, 1200]

const shouldReplacePendingInboxEvent = (existing: InboxMessageEvent, incoming: InboxMessageEvent) => {
  if (incoming.totalMessageCount > existing.totalMessageCount) {
    return true
  }

  if (incoming.totalMessageCount < existing.totalMessageCount) {
    return false
  }

  return Date.parse(incoming.createdAt) >= Date.parse(existing.createdAt)
}

const storePendingInboxEvent = (pending: Map<string, InboxMessageEvent>, payload: InboxMessageEvent) => {
  const existing = pending.get(payload.roomId)

  if (!existing || shouldReplacePendingInboxEvent(existing, payload)) {
    pending.set(payload.roomId, payload)
  }
}

const applyPendingInboxToDmRooms = (
  dmRooms: ChatRoom[],
  pending: Map<string, InboxMessageEvent>,
  activeRoomId?: string,
) => {
  if (pending.size === 0) {
    return dmRooms
  }

  let nextRooms = dmRooms

  for (const [roomId, payload] of pending.entries()) {
    if (activeRoomId && roomId === activeRoomId) {
      pending.delete(roomId)
      continue
    }

    const room = nextRooms.find((item) => item.id === roomId)

    if (!room) {
      continue
    }

    const restMessageTotal = room._count?.messages ?? 0

    if (payload.totalMessageCount > restMessageTotal) {
      nextRooms = promoteRoom(applyInboxUpdate(nextRooms, payload), roomId)
    }

    pending.delete(roomId)
  }

  return nextRooms
}

const waitFor = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })

export function useRooms(activeRoomKey?: string, options?: { isChatTabVisible?: boolean }) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [dmRooms, setDmRooms] = useState<ChatRoom[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)
  const roomsRef = useRef<ChatRoom[]>([])
  const dmRoomsRef = useRef<ChatRoom[]>([])
  const activeRoomKeyRef = useRef(activeRoomKey)
  const isChatTabVisibleRef = useRef(options?.isChatTabVisible ?? false)
  const pendingInboxEventsRef = useRef<Map<string, InboxMessageEvent>>(new Map())
  const unknownDmRefreshInFlightRef = useRef<Promise<void> | null>(null)

  activeRoomKeyRef.current = activeRoomKey
  isChatTabVisibleRef.current = options?.isChatTabVisible ?? false

  const resolveIsChatVisible = useCallback(() => {
    const lookupKey = activeRoomKeyRef.current

    if (!lookupKey) {
      return false
    }

    const activeDm = dmRoomsRef.current.find(
      (room) => room.id === lookupKey || room.slug === lookupKey,
    )

    if (activeDm?.type === 'DM') {
      return true
    }

    return isChatTabVisibleRef.current
  }, [])

  const getActiveRoomId = useCallback(() => {
    const lookupKey = activeRoomKeyRef.current

    if (!lookupKey) {
      return undefined
    }

    const activeRoom = [...roomsRef.current, ...dmRoomsRef.current].find(
      (room) => room.id === lookupKey || room.slug === lookupKey,
    )

    return activeRoom?.id ?? lookupKey
  }, [])

  const resolveActiveRoomId = useCallback(() => getActiveRoomId(), [getActiveRoomId])

  const reconcileDmRooms = useCallback(
    (directMessageRooms: ChatRoom[], currentDmRooms: ChatRoom[]) => {
      const activeRoomKey = activeRoomKeyRef.current
      const activeRoomId = getActiveRoomId()
      const merged = mergeIncomingRooms(directMessageRooms, currentDmRooms)
      const withPending = applyPendingInboxToDmRooms(
        merged,
        pendingInboxEventsRef.current,
        activeRoomId,
      )

      return applyActiveRoomUnreadZero(withPending, activeRoomKey, resolveIsChatVisible())
    },
    [getActiveRoomId, resolveIsChatVisible],
  )

  const resolveUnknownDmRooms = useCallback(async () => {
    if (unknownDmRefreshInFlightRef.current) {
      return unknownDmRefreshInFlightRef.current
    }

    const run = async () => {
      for (let attempt = 0; attempt < UNKNOWN_DM_MAX_ATTEMPTS; attempt += 1) {
        if (attempt > 0) {
          await waitFor(UNKNOWN_DM_RETRY_DELAYS_MS[attempt - 1] ?? 1200)
        }

        if (pendingInboxEventsRef.current.size === 0) {
          return
        }

        try {
          const directMessageRooms = await dmService.list()
          const reconciledDmRooms = reconcileDmRooms(directMessageRooms, dmRoomsRef.current)
          setDmRooms(reconciledDmRooms)

          const unresolvedPendingRoomIds = [...pendingInboxEventsRef.current.keys()].filter(
            (roomId) => !reconciledDmRooms.some((room) => room.id === roomId),
          )

          if (unresolvedPendingRoomIds.length === 0) {
            return
          }
        } catch {
          // Pending events survive for bounded retry or normal polling.
        }
      }
    }

    const refreshPromise = run().finally(() => {
      unknownDmRefreshInFlightRef.current = null
    })

    unknownDmRefreshInFlightRef.current = refreshPromise
    return refreshPromise
  }, [reconcileDmRooms])

  useEffect(() => {
    roomsRef.current = rooms
  }, [rooms])

  useEffect(() => {
    dmRoomsRef.current = dmRooms
  }, [dmRooms])

  const refreshRooms = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingRooms(true)
    setRoomError(null)

    try {
      const [groupRooms, directMessageRooms] = await Promise.all([
        roomService.list(),
        dmService.list(),
      ])

      const activeRoomKey = activeRoomKeyRef.current

      setRooms((currentRooms) =>
        applyActiveRoomUnreadZero(
          mergeIncomingRooms(groupRooms, currentRooms),
          activeRoomKey,
          resolveIsChatVisible(),
        ),
      )
      setDmRooms((currentDmRooms) => reconcileDmRooms(directMessageRooms, currentDmRooms))
    } catch {
      setRoomError('Rooms could not be loaded.')
    } finally {
      if (showLoading) setIsLoadingRooms(false)
    }
  }, [reconcileDmRooms, resolveIsChatVisible])

  useEffect(() => {
    void refreshRooms()

    const interval = window.setInterval(() => {
      void refreshRooms(false)
    }, 15000)

    return () => window.clearInterval(interval)
  }, [refreshRooms])

  const clearLocalUnread = useCallback((roomId: string | undefined) => {
    if (!roomId) return

    setRooms((currentRooms) =>
      currentRooms.map((item) => (item.id === roomId ? { ...item, unreadCount: 0 } : item)),
    )
    setDmRooms((currentRooms) =>
      currentRooms.map((item) => (item.id === roomId ? { ...item, unreadCount: 0 } : item)),
    )
  }, [])

  const handleInboxMessage = useCallback(
    (payload: InboxMessageEvent, currentActiveRoomId?: string, isChatVisible = false) => {
      if (payload.roomId === currentActiveRoomId && isChatVisible) {
        return
      }

      const inDmList = dmRoomsRef.current.some((room) => room.id === payload.roomId)
      const inGroupList = roomsRef.current.some((room) => room.id === payload.roomId)

      if (inDmList) {
        setDmRooms((currentRooms) => promoteRoom(applyInboxUpdate(currentRooms, payload), payload.roomId))
        return
      }

      if (inGroupList) {
        setRooms((currentRooms) => applyInboxUpdate(currentRooms, payload))
        return
      }

      if (payload.roomType === 'DM') {
        storePendingInboxEvent(pendingInboxEventsRef.current, payload)
        void resolveUnknownDmRooms()
        return
      }

      void refreshRooms(false)
    },
    [refreshRooms, resolveUnknownDmRooms],
  )

  const handleInboxMessageRef = useRef(handleInboxMessage)
  handleInboxMessageRef.current = handleInboxMessage

  useEffect(() => {
    inboxSocketService.setHandler((payload) => {
      handleInboxMessageRef.current(payload, resolveActiveRoomId(), resolveIsChatVisible())
    })

    return () => {
      inboxSocketService.setHandler(null)
    }
  }, [resolveActiveRoomId, resolveIsChatVisible])

  const handleActiveRoomMessage = useCallback(
    (message: ChatMessage) => {
      const roomId = message.roomId

      if (!roomId || !message.id) {
        return
      }

      if (roomId !== resolveActiveRoomId()) {
        return
      }

      const inDmList = dmRoomsRef.current.some((room) => room.id === roomId)

      if (inDmList) {
        setDmRooms((currentRooms) =>
          promoteRoom(applyActiveRoomMessageUpdate(currentRooms, message, true), roomId),
        )
        return
      }

      if (roomsRef.current.some((room) => room.id === roomId)) {
        setRooms((currentRooms) => applyActiveRoomMessageUpdate(currentRooms, message, false))
      }
    },
    [resolveActiveRoomId],
  )

  const createRoom = async (payload: CreateRoomPayload) => {
    const room = await roomService.create(payload)
    setRooms((currentRooms) => [{ ...room, unreadCount: 0 }, ...currentRooms.filter((item) => item.id !== room.id)])
    return room
  }

  const createDm = async (userId: string, sourceRoomId: string) => {
    const room = await dmService.create({ sourceRoomId, userId })
    setDmRooms((currentRooms) => [{ ...room, unreadCount: 0 }, ...currentRooms.filter((item) => item.id !== room.id)])
    return room
  }

  const joinRoom = async (joinCode: string) => {
    try {
      const room = await roomService.join(joinCode)
      setRooms((currentRooms) => [{ ...room, unreadCount: 0 }, ...currentRooms.filter((item) => item.id !== room.id)])
      return room
    } catch (error) {
      throw new Error(getRoomJoinErrorMessage(error))
    }
  }
  const updateRoom = async (roomId: string, payload: UpdateRoomPayload) => {
    const previousRooms = rooms
    const optimisticSlug = payload.name ? roomService.createSlug(payload.name) : ''
    const hasMemberLimitChange =
      Object.prototype.hasOwnProperty.call(payload, 'maxMembers') || payload.unlimitedMembers !== undefined
    const nextMaxMembers = payload.unlimitedMembers ? null : payload.maxMembers

    setRooms((currentRooms) =>
      currentRooms.map((room) => {
        if (room.id !== roomId) {
          return room
        }

        return {
          ...room,
          name: payload.name?.trim() || room.name,
          slug: optimisticSlug || room.slug,
          maxMembers: hasMemberLimitChange ? nextMaxMembers ?? null : room.maxMembers,
        }
      }),
    )

    try {
      const room = await roomService.update(roomId, payload)
      setRooms((currentRooms) => currentRooms.map((item) => (item.id === room.id ? room : item)))
      return room
    } catch (error) {
      setRooms(previousRooms)
      throw error
    }
  }

  const deleteRoom = async (roomId: string) => {
    const previousRooms = rooms
    setRooms((currentRooms) => currentRooms.filter((room) => room.id !== roomId))

    try {
      await roomService.delete(roomId)
    } catch (error) {
      setRooms(previousRooms)
      throw error
    }
  }

  const getRoom = (roomId: string | undefined) =>
    [...rooms, ...dmRooms].find((room) => room.id === roomId || room.slug === roomId)

  return {
    clearLocalUnread,
    createDm,
    createRoom,
    deleteRoom,
    dmRooms,
    getRoom,
    handleActiveRoomMessage,
    handleInboxMessage,
    isLoadingRooms,
    joinRoom,
    refreshRooms,
    resolveActiveRoomId,
    roomError,
    rooms,
    updateRoom,
  }
}
