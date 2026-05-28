import { useEffect, useMemo, useState } from 'react'

import type { ChatRoom } from '../types/chat'

const ROOMS_KEY = 'ws_chat_rooms'

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const readRooms = (): ChatRoom[] => {
  try {
    const storedRooms = localStorage.getItem(ROOMS_KEY)
    return storedRooms ? (JSON.parse(storedRooms) as ChatRoom[]) : []
  } catch {
    return []
  }
}

export function useRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>(() => readRooms())

  useEffect(() => {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms))
  }, [rooms])

  const sortedRooms = useMemo(() => rooms, [rooms])

  const createRoom = (name: string) => {
    const cleanName = name.trim()
    const slug = createSlug(cleanName)

    if (!cleanName || !slug) return null

    const existingRoom = rooms.find((room) => room.slug === slug)
    if (existingRoom) return existingRoom

    const room: ChatRoom = {
      id: slug,
      name: cleanName,
      slug,
      description: 'Realtime room',
      unreadCount: 0,
    }

    setRooms((currentRooms) => [room, ...currentRooms])
    return room
  }

  const joinRoom = (slugOrName: string) => {
    const slug = createSlug(slugOrName)
    if (!slug) return null

    const existingRoom = rooms.find((room) => room.slug === slug)
    if (existingRoom) return existingRoom

    const room: ChatRoom = {
      id: slug,
      name: slug
        .split('-')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(' '),
      slug,
      description: 'Joined room',
      unreadCount: 0,
    }

    setRooms((currentRooms) => [room, ...currentRooms])
    return room
  }

  const getRoom = (roomId: string | undefined) => rooms.find((room) => room.id === roomId)

  return { createRoom, getRoom, joinRoom, rooms: sortedRooms }
}
