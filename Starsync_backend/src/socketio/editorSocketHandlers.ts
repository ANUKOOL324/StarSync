import { verifyEditorRoomAccess } from "../services/editorService";
import type { SocketUser } from "../types/socket";
import { resolveSocketRoomId } from "../utils/socketRoom";
import { editorLanguageSchema } from "../validations/editorValidation";
import type {
  EditorChangePayload,
  EditorPresencePayload,
  SocketData,
  SocketIoConnection,
  SocketIoServer,
} from "./socketTypes";

const editorPresenceByRoom = new Map<string, Map<string, SocketUser>>();

const getActiveEditorUsers = (roomId: string): SocketUser[] => {
  const activeClients = editorPresenceByRoom.get(roomId);

  if (!activeClients) {
    return [];
  }

  const usersById = new Map<string, SocketUser>();

  activeClients.forEach((user) => {
    usersById.set(user.id, user);
  });

  return Array.from(usersById.values());
};

const broadcastEditorPresence = (io: SocketIoServer, roomId: string) => {
  io.to(roomId).emit("editor:presence:update", {
    roomId,
    users: getActiveEditorUsers(roomId),
  });
};

export const removeEditorPresenceForRoom = (
  io: SocketIoServer,
  socketId: string,
  roomId: string,
  socketData?: SocketData,
) => {
  const activeClients = editorPresenceByRoom.get(roomId);

  if (!activeClients) {
    return;
  }

  activeClients.delete(socketId);

  if (activeClients.size === 0) {
    editorPresenceByRoom.delete(roomId);
  }

  if (socketData?.activeEditorRoom === roomId) {
    delete socketData.activeEditorRoom;
  }

  broadcastEditorPresence(io, roomId);
};

export const clearEditorPresenceForSocket = (io: SocketIoServer, socket: SocketIoConnection) => {
  const activeRoomId = socket.data.activeEditorRoom;

  if (!activeRoomId) {
    return;
  }

  removeEditorPresenceForRoom(io, socket.id, activeRoomId, socket.data);
};

export const clearEditorPresenceForRoom = (roomId: string) => {
  editorPresenceByRoom.delete(roomId);
};

export const handleEditorChange = async (socket: SocketIoConnection, payload: EditorChangePayload) => {
  if (
    !payload ||
    typeof payload.roomId !== "string" ||
    typeof payload.content !== "string" ||
    typeof payload.language !== "string"
  ) {
    socket.emit("error", { message: "Invalid message" });
    return;
  }

  const roomIdFromClient = payload.roomId.trim();
  const content = payload.content;
  const languageResult = editorLanguageSchema.safeParse(payload.language);

  if (!languageResult.success) {
    socket.emit("error", { message: "Unsupported language." });
    return;
  }

  const verifiedRoomId = await resolveSocketRoomId(roomIdFromClient, socket.data.user.id);

  if (!verifiedRoomId || socket.data.currentRoomId !== verifiedRoomId) {
    socket.emit("error", { message: "Join the room before syncing editor changes" });
    return;
  }

  if (content.length > 50_000) {
    socket.emit("error", { message: "Editor content is too large" });
    return;
  }

  try {
    await verifyEditorRoomAccess(verifiedRoomId, socket.data.user.id);

    socket.to(verifiedRoomId).emit("editor:sync", {
      roomId: verifiedRoomId,
      content,
      language: languageResult.data,
      updatedBy: {
        id: socket.data.user.id,
        username: socket.data.user.username,
      },
    });
  } catch (error) {
    console.error("Socket.IO editor sync failed", error);
    socket.emit("error", { message: "Editor sync failed" });
  }
};

export const handleEditorPresence = async (
  io: SocketIoServer,
  socket: SocketIoConnection,
  payload: EditorPresencePayload,
) => {
  if (
    !payload ||
    typeof payload.roomId !== "string" ||
    (payload.status !== "active" && payload.status !== "inactive")
  ) {
    socket.emit("error", { message: "Invalid message" });
    return;
  }

  const roomIdFromClient = payload.roomId.trim();
  const nextStatus = payload.status;
  const verifiedRoomId = await resolveSocketRoomId(roomIdFromClient, socket.data.user.id);

  if (!verifiedRoomId || socket.data.currentRoomId !== verifiedRoomId) {
    socket.emit("error", { message: "Join the room before updating editor presence" });
    return;
  }

  try {
    await verifyEditorRoomAccess(verifiedRoomId, socket.data.user.id);

    if (nextStatus === "inactive") {
      removeEditorPresenceForRoom(io, socket.id, verifiedRoomId, socket.data);
      return;
    }

    if (socket.data.activeEditorRoom && socket.data.activeEditorRoom !== verifiedRoomId) {
      removeEditorPresenceForRoom(io, socket.id, socket.data.activeEditorRoom, socket.data);
    }

    const activeClients = editorPresenceByRoom.get(verifiedRoomId) ?? new Map<string, SocketUser>();

    activeClients.set(socket.id, socket.data.user);
    editorPresenceByRoom.set(verifiedRoomId, activeClients);
    socket.data.activeEditorRoom = verifiedRoomId;

    broadcastEditorPresence(io, verifiedRoomId);
  } catch (error) {
    console.error("Socket.IO editor presence update failed", error);
    socket.emit("error", { message: "Editor presence update failed" });
  }
};
