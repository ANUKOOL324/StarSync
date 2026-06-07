import { prisma } from "../prisma/client";
import { HttpError } from "../utils/HttpError";
import type { CreateRoomInput, UpdateRoomInput } from "../validations/roomValidation";

const createSlug = (roomName: string): string => {
  const lowercaseName = roomName.toLowerCase().trim();
  const hyphenatedName = lowercaseName.replace(/[^a-z0-9]+/g, "-");
  const cleanSlug = hyphenatedName.replace(/(^-|-$)/g, "");

  return cleanSlug;
};

const roomSelect = {
  id: true,
  name: true,
  slug: true,
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
      members: true,
      messages: true,
    },
  },
} as const;

const findRoomForManagement = async (roomId: string) => {
  const room = await prisma.room.findFirst({
    where: {
      OR: [{ id: roomId }, { slug: roomId }],
    },
    select: {
      id: true,
      adminId: true,
      slug: true,
    },
  });

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  return room;
};

const verifyRoomAdmin = (room: { adminId: string | null }, userId: string) => {
  // Room management is intentionally limited to the creator/admin.
  // The frontend can hide buttons, but this backend check is the real protection.
  const userOwnsRoom = room.adminId === userId;

  if (!userOwnsRoom) {
    throw new HttpError(403, "Only the room admin can manage this room");
  }
};

const ensureSlugIsAvailable = async (slug: string, currentRoomId?: string) => {
  const existingRoom = await prisma.room.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingRoom && existingRoom.id !== currentRoomId) {
    throw new HttpError(409, "Room slug is already taken");
  }
};

export const createRoom = async (input: CreateRoomInput, adminId: string) => {
  const roomSlug = input.slug ?? createSlug(input.name);

  if (!roomSlug) {
    throw new HttpError(400, "Room slug is invalid");
  }

  await ensureSlugIsAvailable(roomSlug);

  const createdRoom = await prisma.room.create({
    data: {
      name: input.name,
      slug: roomSlug,
      type: "GROUP",
      adminId,
      members: {
        create: {
          userId: adminId,
          role: "ADMIN",
        },
      },
    },
    select: roomSelect,
  });

  return createdRoom;
};

export const getRooms = async () => {
  const rooms = await prisma.room.findMany({
    where: { type: "GROUP" },
    orderBy: { createdAt: "desc" },
    select: roomSelect,
  });

  return rooms;
};

export const getRoomByIdOrSlug = async (roomId: string, userId: string) => {
  const room = await prisma.room.findFirst({
    where: {
      OR: [{ id: roomId }, { slug: roomId }],
    },
    select: {
      ...roomSelect,
      members: {
        select: {
          userId: true,
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

  // Group rooms are visible to signed-in users. DM rooms are only visible to members.
  const userCanViewRoom =
    room.type === "GROUP" || room.members.some((member) => member.userId === userId);

  if (!userCanViewRoom) {
    throw new HttpError(403, "You do not have access to this room");
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
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      type: true,
      members: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!room || room.type !== "GROUP" || room.members.length > 0) {
    return;
  }

  // Group rooms are open in this project. When a signed-in user actually joins
  // the websocket room, we record membership so the DM picker can show real people.
  await prisma.roomMember.upsert({
    where: {
      userId_roomId: {
        roomId: room.id,
        userId,
      },
    },
    update: {},
    create: {
      roomId: room.id,
      userId,
      role: "MEMBER",
    },
  });
};

export const getRoomMembers = async (roomId: string, userId: string) => {
  const room = await prisma.room.findFirst({
    where: {
      OR: [{ id: roomId }, { slug: roomId }],
    },
    select: {
      id: true,
      type: true,
      members: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
    },
  });

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  const currentUserIsMember = room.members.some((member) => member.userId === userId);

  if (!currentUserIsMember && room.type === "DM") {
    throw new HttpError(403, "You do not have access to this room");
  }

  if (!currentUserIsMember && room.type === "GROUP") {
    await prisma.roomMember.upsert({
      where: {
        userId_roomId: {
          roomId: room.id,
          userId,
        },
      },
      update: {},
      create: {
        roomId: room.id,
        userId,
        role: "MEMBER",
      },
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (currentUser) {
      return [...room.members.map((member) => member.user), currentUser];
    }
  }

  return room.members.map((member) => member.user);
};

export const updateRoom = async (roomId: string, input: UpdateRoomInput, userId: string) => {
  const room = await findRoomForManagement(roomId);
  verifyRoomAdmin(room, userId);

  const nextRoomSlug = input.slug ?? createSlug(input.name);

  if (!nextRoomSlug) {
    throw new HttpError(400, "Room slug is invalid");
  }

  await ensureSlugIsAvailable(nextRoomSlug, room.id);

  const updatedRoom = await prisma.room.update({
    where: { id: room.id },
    data: {
      name: input.name,
      slug: nextRoomSlug,
    },
    select: roomSelect,
  });

  return updatedRoom;
};

export const deleteRoom = async (roomId: string, userId: string) => {
  const room = await findRoomForManagement(roomId);
  verifyRoomAdmin(room, userId);

  // Prisma schema uses onDelete: Cascade for room messages, so deleting the room
  // also removes its message history in a single trusted backend operation.
  await prisma.room.delete({
    where: { id: room.id },
  });

  return { id: room.id };
};
