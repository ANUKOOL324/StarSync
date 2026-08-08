import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { env } from "../config/env";
import type { SocketUser } from "../types/websocket";
import { authenticateSocketCookie } from "../utils/socketAuth";

interface ClientToServerEvents {}

interface ServerToClientEvents {}

interface InterServerEvents {}

interface SocketData {
  user: SocketUser;
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

    socket.on("disconnect", (reason) => {
      console.log(`Socket.IO disconnected: ${user.username} (${reason})`);
    });
  });

  return io;
};
