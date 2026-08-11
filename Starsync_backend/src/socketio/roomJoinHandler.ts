import { prisma } from "../prisma/client";
import { markRoomReadForUser } from "../services/roomReadService";
import { addGroupRoomMember } from "../services/roomService";
import { resolveSocketRoomId } from "../utils/socketRoom";
import { clearEditorPresenceForSocket } from "./editorSocketHandlers";
import { broadcastPresence } from "./presenceService";
import type { JoinPayload, SocketIoConnection, SocketIoServer } from "./socketTypes";
import { broadcastTypingUpdate, clearTypingTimer } from "./typingHandlers";

export const handleJoin = async (io: SocketIoServer, socket: SocketIoConnection, payload: JoinPayload) => {
  const user = socket.data.user;

  if (typeof payload?.roomId !== "string") {
    socket.emit("error", { message: "Invalid message" });
    return;
  }

  const nextRoomId = await resolveSocketRoomId(payload.roomId, user.id);

  if (!nextRoomId) {
    socket.emit("error", { message: "Room not found or access denied" });
    return;
  }

  try {
    await addGroupRoomMember(nextRoomId, user.id);
  } catch (error) {
    console.error("Socket.IO room join failed", error);
    socket.emit("error", { message: "Room join failed" });
    return;
  }

  const previousRoomId = socket.data.currentRoomId;

  if (previousRoomId && previousRoomId !== nextRoomId) {
    clearTypingTimer(socket.id);
    await broadcastTypingUpdate(io, previousRoomId, user, false);
    clearEditorPresenceForSocket(io, socket);
    await socket.leave(previousRoomId);
    await broadcastPresence(io, previousRoomId);
  }

  await socket.join(nextRoomId);
  socket.data.currentRoomId = nextRoomId;

  const room = await prisma.room.findUnique({
    where: { id: nextRoomId },
    select: { type: true },
  });

  if (room?.type === "DM") {
    socket.data.chatVisible = true;
    await markRoomReadForUser(nextRoomId, user.id);
  } else {
    socket.data.chatVisible = false;
  }

  await broadcastPresence(io, nextRoomId);
};
