import http from "node:http";

import { app } from "./app";
import { env } from "./config/env";
import { attachWebSocketServer } from "./websocket/socketManager";

const server = http.createServer(app);

attachWebSocketServer(server);

server.listen(env.port, env.host, () => {
  console.log(`HTTP and WebSocket server running on ${env.host}:${env.port}`);
});
