import {
  clearEditorPresenceForRoom,
  removeEditorPresenceForRoom,
} from "./editorSocketHandlers";
import { broadcastPresence } from "./presenceService";
import { getActiveSocketIoServer } from "./socketServerState";
import type { RoomRemoteSocket, SocketIoServer } from "./socketTypes";
import { broadcastTypingUpdate, clearTypingTimer } from "./typingHandlers";

const evictSocketFromRoom = async (
  io: SocketIoServer,
  roomId: string,
  remoteSocket: RoomRemoteSocket,
) => {
  clearTypingTimer(remoteSocket.id);
  await broadcastTypingUpdate(io, roomId, remoteSocket.data.user, false);
  removeEditorPresenceForRoom(io, remoteSocket.id, roomId, remoteSocket.data);

  if (remoteSocket.data.currentRoomId === roomId) {
    delete remoteSocket.data.currentRoomId;
    delete remoteSocket.data.chatVisible;
  }

  await remoteSocket.leave(roomId);
  remoteSocket.emit("room:access-removed", { roomId });
};

export const evictUserFromSocketRoom = async (roomId: string, userId: string) => {
  const io = getActiveSocketIoServer();

  if (!io) {
    return;
  }

  const roomSockets = await io.in(roomId).fetchSockets();
  const targetSockets = roomSockets.filter((roomSocket) => roomSocket.data.user.id === userId);

  for (const remoteSocket of targetSockets) {
    await evictSocketFromRoom(io, roomId, remoteSocket);
  }

  if (targetSockets.length > 0) {
    await broadcastPresence(io, roomId);
  }
};

export const evictAllUsersFromSocketRoom = async (roomId: string) => {
  const io = getActiveSocketIoServer();

  if (!io) {
    return;
  }

  const roomSockets = await io.in(roomId).fetchSockets();

  for (const remoteSocket of roomSockets) {
    await evictSocketFromRoom(io, roomId, remoteSocket);
  }

  clearEditorPresenceForRoom(roomId);
};
