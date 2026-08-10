import crypto from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "../prisma/client";
import { HttpError } from "../utils/HttpError";
import { computeUnreadCount } from "./roomReadService";

const userSelect = {
  id: true,
  username: true,
  email: true,
} as const;

const dmRoomSelect = {
  id: true,
  name: true,
  slug: true,
  joinCode: true,
  maxMembers: true,
  type: true,
  createdAt: true,
  adminId: true,
  admin: {
    select: userSelect,
  },
  members: {
    where: { status: "ACTIVE" },
    select: {
      readMessageCount: true,
      user: {
        select: userSelect,
      },
    },
  },
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
      roomId: true,
      sender: {
        select: userSelect,
      },
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

const createDmSlug = (firstUserId: string, secondUserId: string): string => {
  const sortedUserIds = [firstUserId, secondUserId].sort();
  return `dm-${sortedUserIds[0]}-${sortedUserIds[1]}`;
};

const verifyUsersBelongToSourceRoom = async ({
  currentUserId,
  sourceRoomId,
  targetUserId,
}: {
  currentUserId: string;
  sourceRoomId: string;
  targetUserId: string;
}) => {
  const sourceRoom = await prisma.room.findFirst({
    where: {
      OR: [{ id: sourceRoomId }, { slug: sourceRoomId }],
    },
    select: {
      id: true,
      type: true,
      members: {
        where: {
          status: "ACTIVE",
          userId: {
            in: [currentUserId, targetUserId],
          },
        },
        select: {
          userId: true,
        },
      },
    },
  });

  if (!sourceRoom) {
    throw new HttpError(404, "Source room not found");
  }

  if (sourceRoom.type !== "GROUP") {
    throw new HttpError(400, "Direct messages can only be started from group rooms");
  }

  const sourceRoomUserIds = sourceRoom.members.map((member) => member.userId);
  const currentUserIsInSourceRoom = sourceRoomUserIds.includes(currentUserId);
  const targetUserIsInSourceRoom = sourceRoomUserIds.includes(targetUserId);

  if (!currentUserIsInSourceRoom || !targetUserIsInSourceRoom) {
    throw new HttpError(403, "Both users must be members of the source room");
  }
};

const formatDmRoom = (room: any, currentUserId: string) => {
  const otherMember = room.members.find((member: any) => member.user.id !== currentUserId);
  const currentMember = room.members.find((member: any) => member.user.id === currentUserId);
  const otherUser = otherMember?.user ?? null;
  const lastMessage = room.messages[0] ?? null;
  const totalMessageCount = room._count.messages;
  const readMessageCount = currentMember?.readMessageCount ?? totalMessageCount;
  const lastActivityAt = lastMessage?.createdAt ?? room.createdAt;

  return {
    id: room.id,
    name: otherUser?.username ?? room.name,
    slug: room.slug,
    joinCode: room.joinCode,
    maxMembers: room.maxMembers,
    type: room.type,
    createdAt: room.createdAt,
    lastActivityAt,
    adminId: room.adminId,
    admin: room.admin,
    otherUser,
    lastMessage,
    unreadCount: computeUnreadCount(totalMessageCount, readMessageCount),
    _count: room._count,
  };
};

const getDmActivityTimestamp = (room: ReturnType<typeof formatDmRoom>) => {
  const lastMessageAt = room.lastMessage?.createdAt;
  return new Date(lastMessageAt ?? room.createdAt).getTime();
};

export const createOrGetDmRoom = async (
  currentUserId: string,
  targetUserId: string,
  sourceRoomId: string,
) => {
  if (currentUserId === targetUserId) {
    throw new HttpError(400, "You cannot start a DM with yourself");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: userSelect,
  });

  if (!targetUser) {
    throw new HttpError(404, "User not found");
  }

  await verifyUsersBelongToSourceRoom({
    currentUserId,
    sourceRoomId,
    targetUserId,
  });

  const dmSlug = createDmSlug(currentUserId, targetUserId);

  const existingDmRoom = await prisma.room.findUnique({
    where: { slug: dmSlug },
    select: dmRoomSelect,
  });

  if (existingDmRoom) {
    return formatDmRoom(existingDmRoom, currentUserId);
  }

  try {
    const createdDmRoom = await prisma.room.create({
      data: {
        name: targetUser.username,
        slug: dmSlug,
        joinCode: `DM-${crypto.randomUUID()}`,
        maxMembers: null,
        type: "DM",
        members: {
          create: [
            { userId: currentUserId, role: "MEMBER", status: "ACTIVE" },
            { userId: targetUserId, role: "MEMBER", status: "ACTIVE" },
          ],
        },
      },
      select: dmRoomSelect,
    });

    return formatDmRoom(createdDmRoom, currentUserId);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrentDmRoom = await prisma.room.findUnique({
        where: { slug: dmSlug },
        select: dmRoomSelect,
      });

      if (concurrentDmRoom) {
        return formatDmRoom(concurrentDmRoom, currentUserId);
      }
    }

    throw error;
  }
};

export const getDmRoomsForUser = async (currentUserId: string) => {
  const dmRooms = await prisma.room.findMany({
    where: {
      type: "DM",
      members: {
        some: { userId: currentUserId, status: "ACTIVE" },
      },
    },
    select: dmRoomSelect,
  });

  return dmRooms
    .map((room) => formatDmRoom(room, currentUserId))
    .sort((leftRoom, rightRoom) => getDmActivityTimestamp(rightRoom) - getDmActivityTimestamp(leftRoom));
};
