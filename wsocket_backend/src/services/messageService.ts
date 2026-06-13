import { prisma } from "../prisma/client";
import { HttpError } from "../utils/HttpError";

const cleanMessage = (message: string) => message.trim().replace(/\s+/g, " ");

const messageSelect = {
  id: true,
  content: true,
  createdAt: true,
  senderId: true,
  roomId: true,
  sender: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
} as const;

const findAccessibleRoom = async (roomId: string, userId: string) => {
  const room = await prisma.room.findFirst({
    where: { OR: [{ id: roomId }, { slug: roomId }] },
    select: {
      id: true,
      type: true,
      members: {
        where: { userId },
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  const existingMember = room.members[0] ?? null;

  if (existingMember?.status === "REMOVED") {
    throw new HttpError(403, "You were removed from this room");
  }

  if (existingMember?.status !== "ACTIVE") {
    throw new HttpError(403, "You do not have access to this room");
  }

  return room;
};

export const createMessage = async ({
  content,
  roomId,
  senderId,
}: {
  content: string;
  roomId: string;
  senderId: string;
}) => {
  const sanitizedContent = cleanMessage(content);

  if (!sanitizedContent) {
    throw new HttpError(400, "Message cannot be empty");
  }

  if (sanitizedContent.length > 2000) {
    throw new HttpError(400, "Message is too long");
  }

  const room = await findAccessibleRoom(roomId, senderId);

  return prisma.message.create({
    data: {
      content: sanitizedContent,
      roomId: room.id,
      senderId,
    },
    select: messageSelect,
  });
};

export const getRoomMessages = async (roomId: string, limit: number, userId: string, cursor?: string) => {
  const room = await findAccessibleRoom(roomId, userId);

  const messages = await prisma.message.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: messageSelect,
  });

  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  return {
    messages: page.reverse(),
    nextCursor,
  };
};

