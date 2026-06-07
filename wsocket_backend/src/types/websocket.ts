import type { WebSocket } from "ws";

export type SocketUser = {
  id: string;
  username: string;
  email: string;
};

export type ChatClient = {
  id: string;
  socket: WebSocket;
  room: string | undefined;
  activeEditorRoom: string | undefined;
  user: SocketUser;
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
    clientMessageId?: string;
  };
};

export type TypingStartMessage = {
  type: "typing:start";
  payload: {
    roomId: string;
  };
};

export type TypingStopMessage = {
  type: "typing:stop";
  payload: {
    roomId: string;
  };
};

export type EditorChangeMessage = {
  type: "editor:change";
  payload: {
    roomId: string;
    content: string;
    language: string;
  };
};

export type EditorPresenceMessage = {
  type: "editor:presence";
  payload: {
    roomId: string;
    status: "active" | "inactive";
  };
};

export type ClientMessage =
  | JoinMessage
  | ChatMessage
  | TypingStartMessage
  | TypingStopMessage
  | EditorChangeMessage
  | EditorPresenceMessage;
