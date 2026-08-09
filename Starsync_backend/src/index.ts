import http from "node:http";

import { app } from "./app";
import { env } from "./config/env";
import { attachSocketIoServer } from "./socketio/socketIoManager";

const server = http.createServer(app);

attachSocketIoServer(server);

server.listen(env.port, env.host, () => {
  console.log(`HTTP and Socket.IO server running on ${env.host}:${env.port}`);
});
