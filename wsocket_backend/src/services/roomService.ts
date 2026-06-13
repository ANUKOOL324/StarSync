import { prisma } from "../prisma/client";
import { HttpError } from "../utils/HttpError";
import type { CreateRoomInput, JoinRoomInput, UpdateRoomInput } from "../validations/roomValidation";
import { ensureActiveRoomAdmin, ensureGroupRoom, findRoomForAccess, getActiveRoomMember } from "./roomAccessService";

const JOIN_CODE_PREFIX = "RM";
const JOIN_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const createSlug = (roomName: string): string => {
  const lowercaseName = roomName.toLowerCase().trim();
  const hyphenatedName = lowercaseName.replace(/[^a-z0-9]+/g, "-");
  const cleanSlug = hyphenatedName.replace(/(^-|-$)/g, "");

  return cleanSlug;
};

const normalizeJoinCode = (joinCode: string): string => {
  return joinCode.trim().toUpperCase();
};

const createReadableJoinCode = (): string => {
  let code = "";

  for (let index = 0; index < 5; index += 1) {
    const randomIndex = Math.floor(Math.random() * JOIN_CODE_CHARACTERS.length);
    code += JOIN_CODE_CHARACTERS[randomIndex];
  }

  return `${JOIN_CODE_PREFIX}-${code}`;
};

const generateUniqueJoinCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const joinCode = createReadableJoinCode();
    const existingRoom = await prisma.room.findUnique({
      where: { joinCode },
      select: { id: true },
    });

    if (!existingRoom) {
      return joinCode;
    }
  }

  throw new HttpError(500, "Could not generate room code");
};

const roomSelect = {
  id: true,
  name: true,
  slug: true,
  joinCode: true,
  maxMembers: true,
  type: true,
  createdAt: true,
  adminId: true,
  admin: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
  _count: {
    select: {
      members: {
        where: { status: "ACTIVE" },
      },
      messages: true,
    },
  },
} as const;

const ensureSlugIsAvailable = async (slug: string, currentRoomId?: string) => {
  const existingRoom = await prisma.room.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingRoom && existingRoom.id !== currentRoomId) {
    throw new HttpError(409, "Room slug is already taken");
  }
};

const findExistingRoomMember = async (roomId: string, userId: string) => {
  const roomMember = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        roomId,
        userId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  return roomMember;
};

const getSafeMaxMembers = (input: CreateRoomInput): number | null => {
  if (input.unlimitedMembers) {
    return null;
  }

  return input.maxMembers ?? null;
};

const countActiveRoomMembers = async (roomId: string): Promise<number> => {
  return prisma.roomMember.count({
    where: {
      roomId,
      status: "ACTIVE",
    },
  });
};

const getRequestedMaxMembers = (input: UpdateRoomInput): number | null | undefined => {
  if (input.unlimitedMembers) {
    return null;
  }

  return input.maxMembers;
};

export const createRoom = async (input: CreateRoomInput, adminId: string) => {
  const roomSlug = input.slug ?? createSlug(input.name);

  if (!roomSlug) {
    throw new HttpError(400, "Room slug is invalid");
  }

  await ensureSlugIsAvailable(roomSlug);

  const joinCode = await generateUniqueJoinCode();
  const maxMembers = getSafeMaxMembers(input);

  const createdRoom = await prisma.room.create({
    data: {
      name: input.name,
      slug: roomSlug,
      joinCode,
      maxMembers,
      type: "GROUP",
      adminId,
      members: {
        create: {
          userId: adminId,
          role: "ADMIN",
          status: "ACTIVE",
        },
      },
    },
    select: roomSelect,
  });

  return createdRoom;
};

export const getRooms = async (userId: string) => {
  const rooms = await prisma.room.findMany({
    where: {
      type: "GROUP",
      members: {
        some: {
          userId,
          status: "ACTIVE",
        },
      },
    },
    orderBy: { createdAt: "desc" },
    select: roomSelect,
  });

  return rooms;
};

export const joinRoomByCode = async (input: JoinRoomInput, userId: string) => {
  const joinCode = normalizeJoinCode(input.joinCode);
  const room = await prisma.room.findUnique({
    where: { joinCode },
    select: roomSelect,
  });

  if (!room || room.type !== "GROUP") {
    throw new HttpError(404, "Invalid room code.", { code: "INVALID_ROOM_CODE" });
  }

  const existingRoomMember = await findExistingRoomMember(room.id, userId);

  if (existingRoomMember?.status === "REMOVED") {
    throw new HttpError(403, "You were removed from this room and cannot rejoin.", {
      code: "ROOM_ACCESS_REMOVED",
    });
  }

  if (existingRoomMember?.status === "ACTIVE") {
    return room;
  }

  const activeMemberCount = room._count.members;

  if (room.maxMembers !== null && activeMemberCount >= room.maxMembers) {
    throw new HttpError(409, "This room is full.", { code: "ROOM_FULL" });
  }

  await prisma.roomMember.create({
    data: {
      roomId: room.id,
      userId,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });

  const joinedRoom = await prisma.room.findUnique({
    where: { id: room.id },
    select: roomSelect,
  });

  if (!joinedRoom) {
    throw new HttpError(404, "Room not found");
  }

  return joinedRoom;
};

export const getRoomByIdOrSlug = async (roomId: string, userId: string) => {
  const room = await prisma.room.findFirst({
    where: {
      OR: [{ id: roomId }, { slug: roomId }],
    },
    select: {
      ...roomSelect,
      members: {
        where: { status: "ACTIVE" },
        select: {
          userId: true,
          role: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  const currentUserIsActiveMember = room.members.some((member) => member.userId === userId);

  if (!currentUserIsActiveMember) {
    throw new HttpError(403, "You do not have access to this room", { code: "ROOM_ACCESS_DENIED" });
  }

  const otherMember = room.members.find((member) => member.userId !== userId);
  const { members: _members, ...safeRoom } = room;

  if (safeRoom.type === "DM") {
    return {
      ...safeRoom,
      otherUser: otherMember?.user ?? null,
    };
  }

  return safeRoom;
};

export const addGroupRoomMember = async (roomId: string, userId: string) => {
  const room = await findRoomForAccess(roomId);

  if (room.type !== "GROUP") {
    return;
  }

  const activeRoomMember = await getActiveRoomMember(room.id, userId);

  if (!activeRoomMember) {
    throw new HttpError(403, "Join this room with a room code before opening chat");
  }
};

export const getRoomMembers = async (roomId: string, userId: string) => {
  const room = await findRoomForAccess(roomId);
  const currentUserMember = await getActiveRoomMember(room.id, userId);

  if (!currentUserMember) {
    throw new HttpError(403, "You do not have access to this room");
  }

  const members = await prisma.roomMember.findMany({
    where: {
      roomId: room.id,
      status: "ACTIVE",
    },
    orderBy: {
      joinedAt: "asc",
    },
    select: {
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  return members.map((member) => ({
    id: member.user.id,
    username: member.user.username,
    email: member.user.email,
    role: member.role,
    joinedAt: member.joinedAt,
  }));
};

export const updateRoom = async (roomId: string, input: UpdateRoomInput, userId: string) => {
  const { room } = await ensureActiveRoomAdmin(roomId, userId);
  const updateData: {
    name?: string;
    slug?: string;
    maxMembers?: number | null;
  } = {};

  if (input.name) {
    const nextRoomSlug = createSlug(input.name);

    if (!nextRoomSlug) {
      throw new HttpError(400, "Room name is invalid");
    }

    await ensureSlugIsAvailable(nextRoomSlug, room.id);

    updateData.name = input.name;
    updateData.slug = nextRoomSlug;
  }

  const requestedMaxMembers = getRequestedMaxMembers(input);

  if (requestedMaxMembers !== undefined) {
    if (requestedMaxMembers !== null) {
      const activeMemberCount = await countActiveRoomMembers(room.id);

      if (requestedMaxMembers < activeMemberCount) {
        throw new HttpError(409, "Member limit cannot be lower than current active members");
      }
    }

    updateData.maxMembers = requestedMaxMembers;
  }

  if (Object.keys(updateData).length === 0) {
    const currentRoom = await prisma.room.findUnique({
      where: { id: room.id },
      select: roomSelect,
    });

    if (!currentRoom) {
      throw new HttpError(404, "Room not found");
    }

    return currentRoom;
  }

  const updatedRoom = await prisma.room.update({
    where: { id: room.id },
    data: updateData,
    select: roomSelect,
  });

  return updatedRoom;
};

export const deleteRoom = async (roomId: string, userId: string) => {
  const { room } = await ensureActiveRoomAdmin(roomId, userId);

  await prisma.room.delete({
    where: { id: room.id },
  });

  return { id: room.id };
};

export const removeRoomMember = async (roomId: string, targetUserId: string, adminUserId: string) => {
  const { room } = await ensureActiveRoomAdmin(roomId, adminUserId);
  ensureGroupRoom(room);

  if (targetUserId === adminUserId) {
    throw new HttpError(400, "Admins cannot remove themselves");
  }

  const targetRoomMember = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        roomId: room.id,
        userId: targetUserId,
      },
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!targetRoomMember || targetRoomMember.status !== "ACTIVE") {
    throw new HttpError(404, "Active room member not found");
  }

  if (targetRoomMember.role === "ADMIN") {
    throw new HttpError(400, "Admins cannot remove another admin");
  }

  await prisma.roomMember.update({
    where: { id: targetRoomMember.id },
    data: { status: "REMOVED" },
  });

  return { roomId: room.id, userId: targetUserId };
};
