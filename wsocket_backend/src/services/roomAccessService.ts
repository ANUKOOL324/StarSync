import { prisma } from "../prisma/client";
import { HttpError } from "../utils/HttpError";

type RoomForAccess = {
  id: string;
  type: "GROUP" | "DM";
  adminId: string | null;
};

export const findRoomForAccess = async (roomId: string): Promise<RoomForAccess> => {
  const room = await prisma.room.findFirst({
    where: {
      OR: [{ id: roomId }, { slug: roomId }],
    },
    select: {
      id: true,
      type: true,
      adminId: true,
    },
  });

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  return room;
};

export const ensureGroupRoom = (room: RoomForAccess) => {
  if (room.type !== "GROUP") {
    throw new HttpError(400, "This action is only available for group rooms");
  }
};

export const getActiveRoomMember = async (roomId: string, userId: string) => {
  const roomMember = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        roomId,
        userId,
      },
    },
    select: {
      id: true,
      userId: true,
      roomId: true,
      role: true,
      status: true,
      joinedAt: true,
    },
  });

  if (!roomMember || roomMember.status !== "ACTIVE") {
    return null;
  }

  return roomMember;
};

const getExistingRoomMember = async (roomId: string, userId: string) => {
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

export const ensureActiveRoomMember = async (roomId: string, userId: string) => {
  const room = await findRoomForAccess(roomId);
  const activeRoomMember = await getActiveRoomMember(room.id, userId);

  if (!activeRoomMember) {
    throw new HttpError(403, "You do not have access to this room");
  }

  return { room, roomMember: activeRoomMember };
};

export const ensureActiveRoomAdmin = async (roomId: string, userId: string) => {
  const room = await findRoomForAccess(roomId);
  ensureGroupRoom(room);

  const activeRoomMember = await getActiveRoomMember(room.id, userId);
  const userIsAdmin = activeRoomMember?.role === "ADMIN" && room.adminId === userId;

  if (!activeRoomMember || !userIsAdmin) {
    throw new HttpError(403, "Only the active room admin can manage this room");
  }

  return { room, roomMember: activeRoomMember };
};

export const ensureCanJoinRoom = async (roomId: string, userId: string) => {
  const room = await findRoomForAccess(roomId);
  const existingRoomMember = await getExistingRoomMember(room.id, userId);

  if (existingRoomMember?.status === "REMOVED") {
    throw new HttpError(403, "You were removed from this room");
  }

  if (room.type === "DM" && !existingRoomMember) {
    throw new HttpError(403, "You do not have access to this room");
  }

  return room;
};
