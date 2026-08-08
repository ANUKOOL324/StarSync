import type { Server as HttpServer } from "node:http";
import type { Socket } from "socket.io";
import { Server } from "socket.io";

import { env } from "../config/env";
import { addGroupRoomMember } from "../services/roomService";
import type { SocketUser } from "../types/websocket";
import { authenticateSocketCookie } from "../utils/socketAuth";
import { resolveSocketRoomId } from "../utils/socketRoom";

type JoinPayload = {
  roomId: string;
};

type ErrorPayload = {
  message: string;
};

interface ClientToServerEvents {
  join: (payload: JoinPayload) => void;
}

interface ServerToClientEvents {
  error: (payload: ErrorPayload) => void;
}

interface InterServerEvents {}

interface SocketData {
  user: SocketUser;
  currentRoomId?: string;
}

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

const handleJoin = async (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, payload: JoinPayload) => {
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
    await socket.leave(previousRoomId);
  }

  await socket.join(nextRoomId);
  socket.data.currentRoomId = nextRoomId;
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
      void handleJoin(socket, payload).catch((error) => {
        console.error("Socket.IO room join failed", error);
        socket.emit("error", { message: "Room join failed" });
      });
    });

    socket.on("disconnect", (reason) => {
      // Socket.IO removes the socket from all rooms automatically on disconnect.
      console.log(`Socket.IO disconnected: ${user.username} (${reason})`);
    });
  });

  return io;
};
