import type { Server, Socket } from "socket.io";

import type { InboxMessagePayload } from "../services/roomReadService";
import type { SocketUser } from "../types/socket";
import type { EditorLanguage } from "../validations/editorValidation";

export type JoinPayload = {
  roomId: string;
};

export type ChatPayload = {
  message: string;
  clientMessageId?: string;
};

export type TypingStartPayload = {
  roomId: string;
};

export type TypingStopPayload = {
  roomId: string;
};

export type EditorChangePayload = {
  roomId: string;
  content: string;
  language: string;
};

export type EditorPresencePayload = {
  roomId: string;
  status: "active" | "inactive";
};

export type ErrorPayload = {
  message: string;
};

export type PresencePayload = {
  roomId: string;
  onlineCount: number;
  users: SocketUser[];
};

export type MessagePayload = {
  id: string;
  clientMessageId?: string;
  mess: string;
  content: string;
  createdAt: Date;
  senderId: string;
  roomId: string;
  sender: SocketUser;
};

export type MessageErrorPayload = {
  clientMessageId?: string;
  message: string;
};

export type TypingUpdatePayload = {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
};

export type EditorSyncPayload = {
  roomId: string;
  content: string;
  language: EditorLanguage;
  updatedBy: {
    id: string;
    username: string;
  };
};

export type EditorPresenceUpdatePayload = {
  roomId: string;
  users: SocketUser[];
};

export type RoomTimerUpdatedPayload = {
  roomId: string;
  sessionStatus: "WAITING" | "RUNNING" | "ENDED";
  sessionStartedAt: Date | null;
  durationMinutes: number | null;
};

export type RoomSubmissionCreatedPayload = {
  roomId: string;
  problemId: string;
  submissionId: string;
  userId: string;
  username: string;
  status: string;
  language: string;
  passedCount: number;
  totalCount: number;
  runtimeMs?: number;
  submittedAt: Date;
};

export type RoomAccessRemovedPayload = {
  roomId: string;
};

export type ChatVisibilityPayload = {
  roomId: string;
  visible: boolean;
};

export interface ClientToServerEvents {
  join: (payload: JoinPayload) => void;
  chat: (payload: ChatPayload) => void;
  "chat:visibility": (payload: ChatVisibilityPayload) => void;
  "typing:start": (payload: TypingStartPayload) => void;
  "typing:stop": (payload: TypingStopPayload) => void;
  "editor:change": (payload: EditorChangePayload) => void;
  "editor:presence": (payload: EditorPresencePayload) => void;
}

export interface ServerToClientEvents {
  error: (payload: ErrorPayload) => void;
  presence: (payload: PresencePayload) => void;
  message: (payload: MessagePayload) => void;
  "inbox:message": (payload: InboxMessagePayload) => void;
  "message-error": (payload: MessageErrorPayload) => void;
  "typing:update": (payload: TypingUpdatePayload) => void;
  "editor:sync": (payload: EditorSyncPayload) => void;
  "editor:presence:update": (payload: EditorPresenceUpdatePayload) => void;
  ROOM_TIMER_UPDATED: (payload: RoomTimerUpdatedPayload) => void;
  ROOM_SUBMISSION_CREATED: (payload: RoomSubmissionCreatedPayload) => void;
  "room:access-removed": (payload: RoomAccessRemovedPayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: SocketUser;
  currentRoomId?: string;
  activeEditorRoom?: string;
  chatVisible?: boolean;
}

export type SocketIoServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type SocketIoConnection = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type RoomRemoteSocket = Awaited<
  ReturnType<ReturnType<SocketIoServer["in"]>["fetchSockets"]>
>[number];
