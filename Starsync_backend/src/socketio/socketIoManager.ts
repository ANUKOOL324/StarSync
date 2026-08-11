import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { getSocketAllowedOrigins } from "./socketCors";
import { registerSocketConnectionHandlers } from "./registerSocketConnectionHandlers";
import { setActiveSocketIoServer } from "./socketServerState";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  SocketIoServer,
} from "./socketTypes";

export { broadcastSocketIoRoomSubmissionCreated, broadcastSocketIoRoomTimerUpdated } from "./socketBroadcasts";
export { evictAllUsersFromSocketRoom, evictUserFromSocketRoom } from "./roomEvictionService";

export const attachSocketIoServer = (httpServer: HttpServer): SocketIoServer => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      path: "/socket.io",
      cors: {
        origin: getSocketAllowedOrigins(),
        credentials: true,
      },
    },
  );

  setActiveSocketIoServer(io);
  registerSocketConnectionHandlers(io);

  return io;
};
