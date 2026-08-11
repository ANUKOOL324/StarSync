import type { SocketUser } from "../types/socket";
import type {
  SocketIoConnection,
  SocketIoServer,
  TypingStartPayload,
  TypingStopPayload,
} from "./socketTypes";
import { resolveSocketRoomId } from "../utils/socketRoom";

const typingTimersBySocketId = new Map<string, NodeJS.Timeout>();

export const clearTypingTimer = (socketId: string) => {
  const typingTimer = typingTimersBySocketId.get(socketId);

  if (!typingTimer) {
    return;
  }

  clearTimeout(typingTimer);
  typingTimersBySocketId.delete(socketId);
};

export const broadcastTypingUpdate = async (
  io: SocketIoServer,
  roomId: string,
  user: SocketUser,
  isTyping: boolean,
) => {
  const roomSockets = await io.in(roomId).fetchSockets();

  for (const roomSocket of roomSockets) {
    if (roomSocket.data.user.id === user.id) {
      continue;
    }

    roomSocket.emit("typing:update", {
      roomId,
      userId: user.id,
      username: user.username,
      isTyping,
    });
  }
};

export const handleTypingStart = async (
  io: SocketIoServer,
  socket: SocketIoConnection,
  payload: TypingStartPayload,
) => {
  if (typeof payload?.roomId !== "string") {
    return;
  }

  const user = socket.data.user;
  const verifiedRoomId = await resolveSocketRoomId(payload.roomId, user.id);

  if (!verifiedRoomId || socket.data.currentRoomId !== verifiedRoomId) {
    return;
  }

  await broadcastTypingUpdate(io, verifiedRoomId, user, true);
  clearTypingTimer(socket.id);

  const staleTypingTimer = setTimeout(() => {
    typingTimersBySocketId.delete(socket.id);
    void broadcastTypingUpdate(io, verifiedRoomId, user, false).catch((error) => {
      console.error("Socket.IO stale typing update failed", error);
    });
  }, 3000);

  typingTimersBySocketId.set(socket.id, staleTypingTimer);
};

export const handleTypingStop = async (
  io: SocketIoServer,
  socket: SocketIoConnection,
  payload: TypingStopPayload,
) => {
  if (typeof payload?.roomId !== "string") {
    return;
  }

  const user = socket.data.user;
  const verifiedRoomId = await resolveSocketRoomId(payload.roomId, user.id);

  if (!verifiedRoomId || socket.data.currentRoomId !== verifiedRoomId) {
    return;
  }

  clearTypingTimer(socket.id);
  await broadcastTypingUpdate(io, verifiedRoomId, user, false);
};
