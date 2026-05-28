import crypto from "node:crypto";
import type { Server } from "node:http";
import { WebSocketServer } from "ws";

import type { ChatClient, ClientMessage } from "../types/websocket";

const clients: ChatClient[] = [];

const parseClientMessage = (rawMessage: Buffer): ClientMessage | null => {
  try {
    return JSON.parse(rawMessage.toString()) as ClientMessage;
  } catch {
    return null;
  }
};

export const attachWebSocketServer = (server: Server) => {
  const webSocketServer = new WebSocketServer({ server });

  webSocketServer.on("connection", (socket) => {
    const userId = crypto.randomUUID();

    socket.on("message", (rawMessage: Buffer) => {
      const parsedMessage = parseClientMessage(rawMessage);

      if (!parsedMessage) {
        socket.send(JSON.stringify({ error: "Invalid message payload" }));
        return;
      }

      if (parsedMessage.type === "join") {
        clients.push({
          id: userId,
          socket,
          room: parsedMessage.payload.roomId,
        });
      }

      if (parsedMessage.type === "chat") {
        const currentUser = clients.find((client) => client.socket === socket);

        clients.forEach((client) => {
          if (client.room === currentUser?.room) {
            client.socket.send(
              JSON.stringify({
                mess: parsedMessage.payload.message,
                senderId: currentUser?.id,
              }),
            );
          }
        });
      }
    });

    socket.on("close", () => {
      const index = clients.findIndex((client) => client.socket === socket);

      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
  });

  return webSocketServer;
};
