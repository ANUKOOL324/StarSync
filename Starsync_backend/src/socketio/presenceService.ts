import type { SocketUser } from "../types/socket";
import type { SocketIoServer } from "./socketTypes";

export const getOnlineUsersInRoom = async (io: SocketIoServer, roomId: string): Promise<SocketUser[]> => {
  const roomSockets = await io.in(roomId).fetchSockets();
  const usersById = new Map<string, SocketUser>();

  roomSockets.forEach((roomSocket) => {
    usersById.set(roomSocket.data.user.id, roomSocket.data.user);
  });

  return Array.from(usersById.values());
};

export const collectChatViewingUserIds = async (
  io: SocketIoServer,
  roomId: string,
  roomType: "GROUP" | "DM",
) => {
  const roomSockets = await io.in(roomId).fetchSockets();
  const viewingUserIds = new Set<string>();

  roomSockets.forEach((roomSocket) => {
    if (roomType === "DM" || roomSocket.data.chatVisible === true) {
      viewingUserIds.add(roomSocket.data.user.id);
    }
  });

  return viewingUserIds;
};

export const broadcastPresence = async (io: SocketIoServer, roomId: string) => {
  const users = await getOnlineUsersInRoom(io, roomId);

  io.to(roomId).emit("presence", {
    roomId,
    onlineCount: users.length,
    users,
  });
};
