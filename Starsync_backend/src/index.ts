import http from "node:http";

import { app } from "./app";
import { env } from "./config/env";
import { attachSocketIoServer } from "./socketio/socketIoManager";
import { attachWebSocketServer } from "./websocket/socketManager";

const server = http.createServer(app);

attachWebSocketServer(server);
attachSocketIoServer(server);

server.listen(env.port, env.host, () => {
  console.log(`HTTP, WebSocket, and Socket.IO server running on ${env.host}:${env.port}`);
});
