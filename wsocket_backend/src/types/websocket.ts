import type { WebSocket } from "ws";

export type ChatClient = {
  id: string;
  socket: WebSocket;
  room: string;
};

export type JoinMessage = {
  type: "join";
  payload: {
    roomId: string;
  };
};

export type ChatMessage = {
  type: "chat";
  payload: {
    message: string;
  };
};

export type ClientMessage = JoinMessage | ChatMessage;
