import type { Server } from "socket.io";

import { prisma } from "../prisma/client";

export const getUserNotificationRoomId = (userId: string) => `user:${userId}`;

export const computeUnreadCount = (totalMessageCount: number, readMessageCount: number) => {
  return Math.max(totalMessageCount - readMessageCount, 0);
};

export const markRoomReadForUser = async (roomId: string, userId: string) => {
  const totalMessageCount = await prisma.message.count({
    where: { roomId },
  });

  await prisma.roomMember.updateMany({
    where: {
      roomId,
      userId,
      status: "ACTIVE",
    },
    data: {
      readMessageCount: totalMessageCount,
    },
  });

  return totalMessageCount;
};

export const markRoomReadForUsers = async (
  roomId: string,
  userIds: string[],
  totalMessageCount: number,
) => {
  if (userIds.length === 0) {
    return;
  }

  await prisma.roomMember.updateMany({
    where: {
      roomId,
      status: "ACTIVE",
      userId: { in: userIds },
    },
    data: {
      readMessageCount: totalMessageCount,
    },
  });
};

export type InboxMessagePayload = {
  roomId: string;
  roomType: "GROUP" | "DM";
  messageId: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    email: string;
  };
  content: string;
  createdAt: Date;
  unreadCount: number;
  totalMessageCount: number;
};

type MessageNotificationServer = Server<
  Record<string, never>,
  { "inbox:message": (payload: InboxMessagePayload) => void }
>;

export const dispatchMessageNotifications = async ({
  io,
  roomId,
  roomType,
  savedMessage,
  senderId,
  viewingUserIds,
}: {
  io: MessageNotificationServer;
  roomId: string;
  roomType: "GROUP" | "DM";
  savedMessage: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
    sender: InboxMessagePayload["sender"];
  };
  senderId: string;
  viewingUserIds: Set<string>;
}) => {
  const totalMessageCount = await prisma.message.count({
    where: { roomId },
  });

  const readUserIds = new Set(viewingUserIds)
  readUserIds.add(senderId)
  await markRoomReadForUsers(roomId, Array.from(readUserIds), totalMessageCount)

  const inactiveMembers = await prisma.roomMember.findMany({
    where: {
      roomId,
      status: "ACTIVE",
      userId: {
        notIn: [...Array.from(viewingUserIds), senderId],
      },
    },
    select: {
      userId: true,
      readMessageCount: true,
    },
  });

  for (const member of inactiveMembers) {
    io.to(getUserNotificationRoomId(member.userId)).emit("inbox:message", {
      roomId,
      roomType,
      messageId: savedMessage.id,
      senderId: savedMessage.senderId,
      sender: savedMessage.sender,
      content: savedMessage.content,
      createdAt: savedMessage.createdAt,
      unreadCount: computeUnreadCount(totalMessageCount, member.readMessageCount),
      totalMessageCount,
    });
  }
};
