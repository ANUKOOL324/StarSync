import { useCallback, useEffect, useRef, useState } from 'react'

import { dmService } from '../services/dmService'
import { getRoomJoinErrorMessage, roomService } from '../services/roomService'
import type { ChatRoom } from '../types/chat'
import type { CreateRoomPayload, UpdateRoomPayload } from '../services/roomService'

const readSeenCounts = () => {
  try {
    return JSON.parse(localStorage.getItem('ws-chat-seen-counts') ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}

const writeSeenCounts = (counts: Record<string, number>) => {
  localStorage.setItem('ws-chat-seen-counts', JSON.stringify(counts))
}

const withUnreadCounts = (rooms: ChatRoom[]) => {
  const seenCounts = readSeenCounts()

  return rooms.map((room) => {
    const messageCount = room._count?.messages ?? 0
    const seenCount = seenCounts[room.id] ?? messageCount

    return {
      ...room,
      unreadCount: Math.max(messageCount - seenCount, 0),
    }
  })
}

export function useRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [dmRooms, setDmRooms] = useState<ChatRoom[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)
  const roomsRef = useRef<ChatRoom[]>([])
  const dmRoomsRef = useRef<ChatRoom[]>([])

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

      setRooms(withUnreadCounts(groupRooms))
      setDmRooms(withUnreadCounts(directMessageRooms))
    } catch {
      setRoomError('Rooms could not be loaded.')
    } finally {
      if (showLoading) setIsLoadingRooms(false)
    }
  }, [])

  useEffect(() => {
    void refreshRooms()

    const interval = window.setInterval(() => {
      void refreshRooms(false)
    }, 15000)

    return () => window.clearInterval(interval)
  }, [refreshRooms])

  const markRoomRead = useCallback((roomId: string | undefined) => {
    if (!roomId) return

    const allRooms = [...roomsRef.current, ...dmRoomsRef.current]
    const room = allRooms.find((item) => item.id === roomId)
    const messageCount = room?._count?.messages ?? 0
    const seenCounts = readSeenCounts()
    writeSeenCounts({ ...seenCounts, [roomId]: messageCount })

    setRooms((currentRooms) =>
      currentRooms.map((item) => (item.id === roomId ? { ...item, unreadCount: 0 } : item)),
    )
    setDmRooms((currentRooms) =>
      currentRooms.map((item) => (item.id === roomId ? { ...item, unreadCount: 0 } : item)),
    )
  }, [])

  const createRoom = async (payload: CreateRoomPayload) => {
    const room = await roomService.create(payload)
    setRooms((currentRooms) => [room, ...currentRooms.filter((item) => item.id !== room.id)])
    markRoomRead(room.id)
    return room
  }

  const createDm = async (userId: string, sourceRoomId: string) => {
    const room = await dmService.create({ sourceRoomId, userId })
    setDmRooms((currentRooms) => [room, ...currentRooms.filter((item) => item.id !== room.id)])
    markRoomRead(room.id)
    return room
  }

  const joinRoom = async (joinCode: string) => {
    try {
      const room = await roomService.join(joinCode)
      setRooms((currentRooms) => [room, ...currentRooms.filter((item) => item.id !== room.id)])
      markRoomRead(room.id)
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
    createDm,
    createRoom,
    deleteRoom,
    dmRooms,
    getRoom,
    isLoadingRooms,
    joinRoom,
    markRoomRead,
    refreshRooms,
    roomError,
    rooms,
    updateRoom,
  }
}

