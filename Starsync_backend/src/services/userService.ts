import { prisma } from "../prisma/client";

export const searchUsers = async (query: string, currentUserId: string) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      OR: [
        { username: { contains: trimmedQuery, mode: "insensitive" } },
        { email: { contains: trimmedQuery, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { username: "asc" },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });
};
