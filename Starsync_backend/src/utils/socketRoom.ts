import { prisma } from "../prisma/client";

export const resolveSocketRoomId = async (roomId: string, userId: string): Promise<string | null> => {
  const trimmedRoomId = roomId.trim();

  if (!trimmedRoomId) {
    return null;
  }

  const room = await prisma.room.findFirst({
    where: {
      OR: [{ id: trimmedRoomId }, { slug: trimmedRoomId }],
    },
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
    return null;
  }

  const existingMember = room.members[0] ?? null;

  if (existingMember?.status === "REMOVED") {
    return null;
  }

  return existingMember?.status === "ACTIVE" ? room.id : null;
};
