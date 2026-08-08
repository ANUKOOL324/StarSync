import type { Server as HttpServer } from "node:http";
import type { Socket } from "socket.io";
import { Server } from "socket.io";

import { env } from "../config/env";
import { verifyEditorRoomAccess } from "../services/editorService";
import { createMessage } from "../services/messageService";
import { addGroupRoomMember } from "../services/roomService";
import type { SocketUser } from "../types/websocket";
import { authenticateSocketCookie } from "../utils/socketAuth";
import { resolveSocketRoomId } from "../utils/socketRoom";
import { editorLanguageSchema, type EditorLanguage } from "../validations/editorValidation";

type JoinPayload = {
  roomId: string;
};

type ChatPayload = {
  message: string;
  clientMessageId?: string;
};

type TypingStartPayload = {
  roomId: string;
};

type TypingStopPayload = {
  roomId: string;
};

type EditorChangePayload = {
  roomId: string;
  content: string;
  language: string;
};

type ErrorPayload = {
  message: string;
};

type PresencePayload = {
  roomId: string;
  onlineCount: number;
  users: SocketUser[];
};

type MessagePayload = {
  id: string;
  clientMessageId?: string;
  mess: string;
  content: string;
  createdAt: Date;
  senderId: string;
  roomId: string;
  sender: SocketUser;
};

type MessageErrorPayload = {
  clientMessageId?: string;
  message: string;
};

type TypingUpdatePayload = {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
};

type EditorSyncPayload = {
  roomId: string;
  content: string;
  language: EditorLanguage;
  updatedBy: {
    id: string;
    username: string;
  };
};

interface ClientToServerEvents {
  join: (payload: JoinPayload) => void;
  chat: (payload: ChatPayload) => void;
  "typing:start": (payload: TypingStartPayload) => void;
  "typing:stop": (payload: TypingStopPayload) => void;
  "editor:change": (payload: EditorChangePayload) => void;
}

interface ServerToClientEvents {
  error: (payload: ErrorPayload) => void;
  presence: (payload: PresencePayload) => void;
  message: (payload: MessagePayload) => void;
  "message-error": (payload: MessageErrorPayload) => void;
  "typing:update": (payload: TypingUpdatePayload) => void;
  "editor:sync": (payload: EditorSyncPayload) => void;
}

interface InterServerEvents {}

interface SocketData {
  user: SocketUser;
  currentRoomId?: string;
}

type SocketIoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

type SocketIoConnection = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

const typingTimersBySocketId = new Map<string, NodeJS.Timeout>();

const getAllowedOrigins = (): string[] => {
  return Array.from(
    new Set([
      env.frontendUrl,
      env.clientOrigin,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ]),
  );
};

const clearTypingTimer = (socketId: string) => {
  const typingTimer = typingTimersBySocketId.get(socketId);

  if (!typingTimer) {
    return;
  }

  clearTimeout(typingTimer);
  typingTimersBySocketId.delete(socketId);
};

const broadcastTypingUpdate = async (
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

const getOnlineUsersInRoom = async (io: SocketIoServer, roomId: string): Promise<SocketUser[]> => {
  const roomSockets = await io.in(roomId).fetchSockets();
  const usersById = new Map<string, SocketUser>();

  roomSockets.forEach((roomSocket) => {
    usersById.set(roomSocket.data.user.id, roomSocket.data.user);
  });

  return Array.from(usersById.values());
};

const broadcastPresence = async (io: SocketIoServer, roomId: string) => {
  const users = await getOnlineUsersInRoom(io, roomId);

  io.to(roomId).emit("presence", {
    roomId,
    onlineCount: users.length,
    users,
  });
};

const handleJoin = async (io: SocketIoServer, socket: SocketIoConnection, payload: JoinPayload) => {
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
    await socket.leave(previousRoomId);
    await broadcastPresence(io, previousRoomId);
  }

  await socket.join(nextRoomId);
  socket.data.currentRoomId = nextRoomId;
  await broadcastPresence(io, nextRoomId);
};

const handleChat = async (io: SocketIoServer, socket: SocketIoConnection, payload: ChatPayload) => {
  const messageContent = typeof payload?.message === "string" ? payload.message.trim() : "";
  const clientMessageId = payload?.clientMessageId;
  const roomId = socket.data.currentRoomId;

  if (!roomId || !messageContent) {
    socket.emit("message-error", {
      ...(clientMessageId ? { clientMessageId } : {}),
      message: "Join a room before sending messages",
    });
    return;
  }

  clearTypingTimer(socket.id);
  await broadcastTypingUpdate(io, roomId, socket.data.user, false);

  try {
    const savedMessage = await createMessage({
      content: messageContent,
      roomId,
      senderId: socket.data.user.id,
    });

    io.to(roomId).emit("message", {
      id: savedMessage.id,
      ...(clientMessageId ? { clientMessageId } : {}),
      mess: savedMessage.content,
      content: savedMessage.content,
      createdAt: savedMessage.createdAt,
      senderId: savedMessage.senderId,
      roomId: savedMessage.roomId,
      sender: savedMessage.sender,
    });
  } catch (error) {
    console.error("Socket.IO message persistence failed", error);
    socket.emit("message-error", {
      ...(clientMessageId ? { clientMessageId } : {}),
      message: "Message could not be saved",
    });
  }
};

const handleTypingStart = async (
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

const handleTypingStop = async (
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

const handleEditorChange = async (socket: SocketIoConnection, payload: EditorChangePayload) => {
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

export const attachSocketIoServer = (httpServer: HttpServer) => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      path: "/socket.io",
      cors: {
        origin: getAllowedOrigins(),
        credentials: true,
      },
    },
  );

  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    const authResult = await authenticateSocketCookie(cookieHeader);

    if (!authResult.ok) {
      const reason = authResult.reason === "missing" ? "missing session cookie" : "invalid session";
      console.log(`Rejected Socket.IO connection: ${reason}`);
      return next(new Error("Unauthorized"));
    }

    socket.data.user = authResult.user;
    next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`Socket.IO connected: ${user.username}`);

    socket.on("join", (payload) => {
      void handleJoin(io, socket, payload).catch((error) => {
        console.error("Socket.IO room join failed", error);
        socket.emit("error", { message: "Room join failed" });
      });
    });

    socket.on("chat", (payload) => {
      void handleChat(io, socket, payload).catch((error) => {
        console.error("Socket.IO chat failed", error);
        socket.emit("message-error", {
          ...(payload?.clientMessageId ? { clientMessageId: payload.clientMessageId } : {}),
          message: "Message could not be saved",
        });
      });
    });

    socket.on("typing:start", (payload) => {
      void handleTypingStart(io, socket, payload).catch((error) => {
        console.error("Socket.IO typing start failed", error);
      });
    });

    socket.on("typing:stop", (payload) => {
      void handleTypingStop(io, socket, payload).catch((error) => {
        console.error("Socket.IO typing stop failed", error);
      });
    });

    socket.on("editor:change", (payload) => {
      void handleEditorChange(socket, payload).catch((error) => {
        console.error("Socket.IO editor sync failed", error);
        socket.emit("error", { message: "Editor sync failed" });
      });
    });

    socket.on("disconnecting", () => {
      const roomId = socket.data.currentRoomId;

      clearTypingTimer(socket.id);

      if (roomId) {
        void broadcastTypingUpdate(io, roomId, socket.data.user, false).catch((error) => {
          console.error("Socket.IO typing cleanup failed", error);
        });
      }
    });

    socket.on("disconnect", (reason) => {
      const roomId = socket.data.currentRoomId;

      if (roomId) {
        void broadcastPresence(io, roomId).catch((error) => {
          console.error("Socket.IO presence update failed", error);
        });
      }

      console.log(`Socket.IO disconnected: ${user.username} (${reason})`);
    });
  });

  return io;
};
