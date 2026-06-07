import crypto from "node:crypto";
import type { IncomingMessage, Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";

import { prisma } from "../prisma/client";
import { createMessage } from "../services/messageService";
import { verifyEditorRoomAccess } from "../services/editorService";
import { addGroupRoomMember } from "../services/roomService";
import { editorLanguageSchema } from "../validations/editorValidation";
import type {
  ChatClient,
  ChatMessage,
  ClientMessage,
  EditorChangeMessage,
  EditorPresenceMessage,
  SocketUser,
} from "../types/websocket";
import { verifyAuthToken, type AuthTokenPayload } from "../utils/jwt";

type SuccessfulSocketAuth = {
  ok: true;
  payload: AuthTokenPayload;
};

type FailedSocketAuth = {
  ok: false;
  reason: "missing" | "invalid" | "expired";
};

type SocketAuthResult = SuccessfulSocketAuth | FailedSocketAuth;

const connectedClients: ChatClient[] = [];
const typingTimersByClientId = new Map<string, NodeJS.Timeout>();
const editorPresenceByRoom = new Map<string, Map<string, SocketUser>>();

const parseClientMessage = (rawMessage: Buffer): ClientMessage | null => {
  try {
    const messageText = rawMessage.toString();
    const parsedMessage = JSON.parse(messageText) as ClientMessage;

    return parsedMessage;
  } catch {
    return null;
  }
};

const getTokenFromRequest = (request: IncomingMessage): string | null => {
  const requestHost = request.headers.host ?? "localhost";
  const requestUrl = new URL(request.url ?? "", `http://${requestHost}`);
  const token = requestUrl.searchParams.get("token");

  return token;
};

const verifySocketToken = (request: IncomingMessage): SocketAuthResult => {
  const token = getTokenFromRequest(request);

  if (!token) {
    return { ok: false, reason: "missing" };
  }

  try {
    const verifiedPayload = verifyAuthToken(token);

    return { ok: true, payload: verifiedPayload };
  } catch (error) {
    const tokenExpired = error instanceof Error && error.name === "TokenExpiredError";
    const reason = tokenExpired ? "expired" : "invalid";

    return { ok: false, reason };
  }
};

const findConnectedClient = (clientId: string) => {
  const client = connectedClients.find((connectedClient) => connectedClient.id === clientId);

  return client;
};

const getClientsInRoom = (roomId: string) => {
  const roomClients = connectedClients.filter((client) => client.room === roomId);

  return roomClients;
};

const sendSocketError = (socket: WebSocket, message: string) => {
  if (socket.readyState !== socket.OPEN) return;

  socket.send(
    JSON.stringify({
      type: "error",
      payload: { message },
    }),
  );
};

const sendJsonToClient = (client: ChatClient, payload: unknown) => {
  if (client.socket.readyState !== client.socket.OPEN) return;

  client.socket.send(JSON.stringify(payload));
};

const broadcastToRoom = (roomId: string, payload: unknown) => {
  const roomClients = getClientsInRoom(roomId);

  roomClients.forEach((client) => {
    sendJsonToClient(client, payload);
  });
};

const broadcastToOtherClientsInRoom = (
  roomId: string,
  senderClientId: string,
  payload: unknown,
) => {
  const roomClients = getClientsInRoom(roomId);
  const otherRoomClients = roomClients.filter((client) => client.id !== senderClientId);

  otherRoomClients.forEach((client) => {
    sendJsonToClient(client, payload);
  });
};

const broadcastPresence = (roomId: string) => {
  const usersById = new Map<string, SocketUser>();
  const roomClients = getClientsInRoom(roomId);

  roomClients.forEach((client) => {
    usersById.set(client.user.id, client.user);
  });

  broadcastToRoom(roomId, {
    type: "presence",
    payload: {
      roomId,
      onlineCount: usersById.size,
      users: Array.from(usersById.values()),
    },
  });
};

const getActiveEditorUsers = (roomId: string): SocketUser[] => {
  const activeClients = editorPresenceByRoom.get(roomId);

  if (!activeClients) {
    return [];
  }

  const usersById = new Map<string, SocketUser>();

  activeClients.forEach((user) => {
    usersById.set(user.id, user);
  });

  return Array.from(usersById.values());
};

const broadcastEditorPresence = (roomId: string) => {
  broadcastToRoom(roomId, {
    type: "editor:presence:update",
    payload: {
      roomId,
      users: getActiveEditorUsers(roomId),
    },
  });
};

const removeEditorPresenceForRoom = (client: ChatClient, roomId: string) => {
  const activeClients = editorPresenceByRoom.get(roomId);

  if (!activeClients) {
    return;
  }

  activeClients.delete(client.id);

  if (activeClients.size === 0) {
    editorPresenceByRoom.delete(roomId);
  }

  if (client.activeEditorRoom === roomId) {
    client.activeEditorRoom = undefined;
  }

  broadcastEditorPresence(roomId);
};

const clearEditorPresenceForClient = (client: ChatClient) => {
  const activeRoomId = client.activeEditorRoom;

  if (!activeRoomId) {
    return;
  }

  removeEditorPresenceForRoom(client, activeRoomId);
};

const broadcastTypingUpdate = (client: ChatClient, roomId: string, isTyping: boolean) => {
  const roomClients = getClientsInRoom(roomId);
  const otherRoomClients = roomClients.filter((roomClient) => roomClient.user.id !== client.user.id);

  otherRoomClients.forEach((roomClient) => {
    sendJsonToClient(roomClient, {
      type: "typing:update",
      payload: {
        roomId,
        userId: client.user.id,
        username: client.user.username,
        isTyping,
      },
    });
  });
};

const clearTypingTimer = (clientId: string) => {
  const typingTimer = typingTimersByClientId.get(clientId);

  if (!typingTimer) return;

  clearTimeout(typingTimer);
  typingTimersByClientId.delete(clientId);
};

const removeConnectedClient = (clientId: string) => {
  const clientIndex = connectedClients.findIndex((client) => client.id === clientId);

  if (clientIndex !== -1) {
    connectedClients.splice(clientIndex, 1);
  }
};

const leaveCurrentRoom = (client: ChatClient) => {
  const previousRoomId = client.room;

  if (!previousRoomId) return;

  // Leaving a room must also clear typing state so other users do not see stale indicators.
  clearTypingTimer(client.id);
  broadcastTypingUpdate(client, previousRoomId, false);
  clearEditorPresenceForClient(client);
  client.room = undefined;
  broadcastPresence(previousRoomId);
};

const resolveAuthenticatedSocketUser = async (
  tokenPayload: AuthTokenPayload,
): Promise<SocketUser> => {
  // The JWT proves the token was signed by us. This database lookup proves the user still exists.
  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.userId },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("Authenticated WebSocket user was not found");
  }

  return user;
};

const resolveRoomId = async (roomId: string, userId: string): Promise<string | null> => {
  const trimmedRoomId = roomId.trim();

  if (!trimmedRoomId) return null;

  const room = await prisma.room.findFirst({
    where: {
      OR: [{ id: trimmedRoomId }, { slug: trimmedRoomId }],
    },
    select: {
      id: true,
      type: true,
      members: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!room) return null;

  const userCanJoinRoom = room.type === "GROUP" || room.members.length > 0;

  return userCanJoinRoom ? room.id : null;
};

const handleJoinMessage = async (client: ChatClient, roomIdFromClient: string) => {
  const nextRoomId = await resolveRoomId(roomIdFromClient, client.user.id);

  if (!nextRoomId) {
    sendSocketError(client.socket, "Room not found or access denied");
    return;
  }

  if (client.room && client.room !== nextRoomId) {
    leaveCurrentRoom(client);
  }

  client.room = nextRoomId;
  await addGroupRoomMember(nextRoomId, client.user.id);
  broadcastPresence(nextRoomId);
};

const handleTypingStart = async (client: ChatClient, roomId: string) => {
  const verifiedRoomId = await resolveRoomId(roomId, client.user.id);
  if (!verifiedRoomId || client.room !== verifiedRoomId) return;

  broadcastTypingUpdate(client, verifiedRoomId, true);
  clearTypingTimer(client.id);

  const staleTypingTimer = setTimeout(() => {
    typingTimersByClientId.delete(client.id);
    broadcastTypingUpdate(client, verifiedRoomId, false);
  }, 3000); // Stop showing user after 2-3 seconds of no typing

  typingTimersByClientId.set(client.id, staleTypingTimer);
};

const handleTypingStop = async (client: ChatClient, roomId: string) => {
  const verifiedRoomId = await resolveRoomId(roomId, client.user.id);
  if (!verifiedRoomId || client.room !== verifiedRoomId) return;

  clearTypingTimer(client.id);
  broadcastTypingUpdate(client, verifiedRoomId, false);
};

const handleChatMessage = async (client: ChatClient, parsedMessage: ChatMessage) => {
  const messageContent = parsedMessage.payload.message.trim();
  const clientMessageId = parsedMessage.payload.clientMessageId;

  if (!client.room || !messageContent) {
    client.socket.send(
      JSON.stringify({
        type: "message-error",
        payload: {
          clientMessageId,
          message: "Join a room before sending messages",
        },
      }),
    );
    return;
  }

  try {
    clearTypingTimer(client.id);
    broadcastTypingUpdate(client, client.room, false);

    // The sender id comes from the authenticated socket, never from the frontend payload.
    const savedMessage = await createMessage({
      content: messageContent,
      roomId: client.room,
      senderId: client.user.id,
    });

    broadcastToRoom(client.room, {
      type: "message",
      payload: {
        id: savedMessage.id,
        clientMessageId,
        mess: savedMessage.content,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
        senderId: savedMessage.senderId,
        roomId: savedMessage.roomId,
        sender: savedMessage.sender,
      },
    });
  } catch (error) {
    console.error("WebSocket message persistence failed", error);
    client.socket.send(
      JSON.stringify({
        type: "message-error",
        payload: {
          clientMessageId,
          message: "Message could not be saved",
        },
      }),
    );
  }
};

const handleEditorChange = async (client: ChatClient, parsedMessage: EditorChangeMessage) => {
  const roomIdFromClient = parsedMessage.payload.roomId.trim();
  const content = parsedMessage.payload.content;
  const languageResult = editorLanguageSchema.safeParse(parsedMessage.payload.language);

  if (!languageResult.success) {
    sendSocketError(client.socket, "Unsupported language.");
    return;
  }

  const verifiedRoomId = await resolveRoomId(roomIdFromClient, client.user.id);

  if (!verifiedRoomId || client.room !== verifiedRoomId) {
    sendSocketError(client.socket, "Join the room before syncing editor changes");
    return;
  }

  if (content.length > 50_000) {
    sendSocketError(client.socket, "Editor content is too large");
    return;
  }

  try {
    // The socket user was verified from JWT. This check confirms that the
    // verified user is allowed to use the editor for this specific room.
    await verifyEditorRoomAccess(verifiedRoomId, client.user.id);

    broadcastToOtherClientsInRoom(verifiedRoomId, client.id, {
      type: "editor:sync",
      payload: {
        roomId: verifiedRoomId,
        content,
        language: languageResult.data,
        updatedBy: {
          id: client.user.id,
          username: client.user.username,
        },
      },
    });
  } catch (error) {
    console.error("WebSocket editor sync failed", error);
    sendSocketError(client.socket, "Editor sync failed");
  }
};

const handleEditorPresence = async (client: ChatClient, parsedMessage: EditorPresenceMessage) => {
  const roomIdFromClient = parsedMessage.payload.roomId.trim();
  const nextStatus = parsedMessage.payload.status;
  const verifiedRoomId = await resolveRoomId(roomIdFromClient, client.user.id);

  if (!verifiedRoomId || client.room !== verifiedRoomId) {
    sendSocketError(client.socket, "Join the room before updating editor presence");
    return;
  }

  try {
    // Presence is still protected by the same editor access check as editor sync.
    // This prevents a user from appearing inside an editor they cannot open.
    await verifyEditorRoomAccess(verifiedRoomId, client.user.id);

    if (nextStatus === "inactive") {
      removeEditorPresenceForRoom(client, verifiedRoomId);
      return;
    }

    if (client.activeEditorRoom && client.activeEditorRoom !== verifiedRoomId) {
      removeEditorPresenceForRoom(client, client.activeEditorRoom);
    }

    const activeClients = editorPresenceByRoom.get(verifiedRoomId) ?? new Map<string, SocketUser>();

    activeClients.set(client.id, client.user);
    editorPresenceByRoom.set(verifiedRoomId, activeClients);
    client.activeEditorRoom = verifiedRoomId;

    broadcastEditorPresence(verifiedRoomId);
  } catch (error) {
    console.error("WebSocket editor presence update failed", error);
    sendSocketError(client.socket, "Editor presence update failed");
  }
};

const registerClientHandlers = (
  client: ChatClient,
  authenticatedUserPromise: Promise<SocketUser>,
) => {
  const { socket } = client;

  socket.on("message", async (rawMessage: Buffer) => {
    let verifiedUser: SocketUser;

    try {
      // A client may send "join" immediately after the socket opens.
      // Waiting here prevents a race while Prisma confirms the user still exists.
      verifiedUser = await authenticatedUserPromise;
    } catch (error) {
      console.warn("Closing WebSocket for unresolved authenticated user", error);
      socket.close(1008, "Unauthorized");
      return;
    }

    client.user = verifiedUser;

    const parsedMessage = parseClientMessage(rawMessage);
    const currentClient = findConnectedClient(client.id);

    if (!currentClient || !parsedMessage) {
      sendSocketError(socket, "Invalid message");
      return;
    }

    if (parsedMessage.type === "join") {
      try {
        await handleJoinMessage(currentClient, parsedMessage.payload.roomId);
      } catch (error) {
        console.error("WebSocket room join failed", error);
        sendSocketError(socket, "Room join failed");
      }

      return;
    }

    if (parsedMessage.type === "typing:start") {
      await handleTypingStart(currentClient, parsedMessage.payload.roomId);
      return;
    }

    if (parsedMessage.type === "typing:stop") {
      await handleTypingStop(currentClient, parsedMessage.payload.roomId);
      return;
    }

    if (parsedMessage.type === "chat") {
      await handleChatMessage(currentClient, parsedMessage);
      return;
    }

    if (parsedMessage.type === "editor:change") {
      await handleEditorChange(currentClient, parsedMessage);
      return;
    }

    if (parsedMessage.type === "editor:presence") {
      await handleEditorPresence(currentClient, parsedMessage);
    }
  });

  socket.on("close", () => {
    const existingClient = findConnectedClient(client.id);

    if (existingClient?.room) {
      leaveCurrentRoom(existingClient);
    } else if (existingClient) {
      clearEditorPresenceForClient(existingClient);
    }

    removeConnectedClient(client.id);
  });
};

export const attachWebSocketServer = (server: Server) => {
  const webSocketServer = new WebSocketServer({ server });

  webSocketServer.on("connection", (socket, request) => {
    const authResult = verifySocketToken(request);

    if (!authResult.ok) {
      console.warn(`Rejected WebSocket connection: ${authResult.reason} token`);
      socket.close(1008, "Unauthorized");
      return;
    }

    // The temporary user value lets us create the client immediately.
    // Message handling still waits for resolveAuthenticatedSocketUser before trusting it.
    const client: ChatClient = {
      id: crypto.randomUUID(),
      socket,
      room: undefined,
      activeEditorRoom: undefined,
      user: {
        id: authResult.payload.userId,
        username: authResult.payload.email.split("@")[0] || "User",
        email: authResult.payload.email,
      },
    };

    connectedClients.push(client);

    const authenticatedUserPromise = resolveAuthenticatedSocketUser(authResult.payload).then((user) => {
      client.user = user;
      return user;
    });

    void authenticatedUserPromise.catch((error) => {
      console.warn("Rejected WebSocket connection after user lookup failed", error);
      removeConnectedClient(client.id);
      socket.close(1008, "Unauthorized");
    });

    registerClientHandlers(client, authenticatedUserPromise);
  });

  return webSocketServer;
};




