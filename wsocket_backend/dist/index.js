"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const socketManager_1 = require("./websocket/socketManager");
const server = node_http_1.default.createServer(app_1.app);
(0, socketManager_1.attachWebSocketServer)(server);
server.listen(env_1.env.port, () => {
    console.log(`HTTP and WebSocket server running on port ${env_1.env.port}`);
});
//# sourceMappingURL=index.js.map