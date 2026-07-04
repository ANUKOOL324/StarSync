import http from "node:http";

import { app } from "./app";
import { env } from "./config/env";
import { attachWebSocketServer } from "./websocket/socketManager";

const server = http.createServer(app);

attachWebSocketServer(server);

server.listen(env.port, () => {
  console.log(`HTTP and WebSocket server running on port ${env.port}`);
});
