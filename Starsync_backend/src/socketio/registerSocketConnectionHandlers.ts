import { getUserNotificationRoomId } from "../services/roomReadService";
import { authenticateSocketCookie } from "../utils/socketAuth";
import { handleChat, handleChatVisibility } from "./chatHandlers";
import { handleEditorChange, handleEditorPresence, clearEditorPresenceForSocket } from "./editorSocketHandlers";
import { broadcastPresence } from "./presenceService";
import { handleJoin } from "./roomJoinHandler";
import type { SocketIoServer, SocketIoConnection } from "./socketTypes";
import { handleTypingStart, handleTypingStop, broadcastTypingUpdate, clearTypingTimer } from "./typingHandlers";

export const registerSocketConnectionHandlers = (io: SocketIoServer) => {
  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    const authResult = await authenticateSocketCookie(cookieHeader);

    if (!authResult.ok) {
      const reason = authResult.reason === "missing" ? "missing session cookie" : "invalid session";
      console.log(`Rejected Socket.IO connection: ${reason}`);
      return next(new Error("Unauthorized"));
    }

    socket.data.user = authResult.user;
    next();
  });

  io.on("connection", async (socket: SocketIoConnection) => {
    const user = socket.data.user;
    console.log(`Socket.IO connected: ${user.username}`);

    await socket.join(getUserNotificationRoomId(user.id));

    socket.on("join", (payload) => {
      void handleJoin(io, socket, payload).catch((error) => {
        console.error("Socket.IO room join failed", error);
        socket.emit("error", { message: "Room join failed" });
      });
    });

    socket.on("chat", (payload) => {
      void handleChat(io, socket, payload).catch((error) => {
        console.error("Socket.IO chat failed", error);
        socket.emit("message-error", {
          ...(payload?.clientMessageId ? { clientMessageId: payload.clientMessageId } : {}),
          message: "Message could not be saved",
        });
      });
    });

    socket.on("chat:visibility", (payload) => {
      void handleChatVisibility(io, socket, payload).catch((error) => {
        console.error("Socket.IO chat visibility update failed", error);
      });
    });

    socket.on("typing:start", (payload) => {
      void handleTypingStart(io, socket, payload).catch((error) => {
        console.error("Socket.IO typing start failed", error);
      });
    });

    socket.on("typing:stop", (payload) => {
      void handleTypingStop(io, socket, payload).catch((error) => {
        console.error("Socket.IO typing stop failed", error);
      });
    });

    socket.on("editor:change", (payload) => {
      void handleEditorChange(socket, payload).catch((error) => {
        console.error("Socket.IO editor sync failed", error);
        socket.emit("error", { message: "Editor sync failed" });
      });
    });

    socket.on("editor:presence", (payload) => {
      void handleEditorPresence(io, socket, payload).catch((error) => {
        console.error("Socket.IO editor presence update failed", error);
        socket.emit("error", { message: "Editor presence update failed" });
      });
    });

    socket.on("disconnecting", () => {
      const roomId = socket.data.currentRoomId;

      clearTypingTimer(socket.id);

      if (roomId) {
        void broadcastTypingUpdate(io, roomId, socket.data.user, false).catch((error) => {
          console.error("Socket.IO typing cleanup failed", error);
        });
      }

      clearEditorPresenceForSocket(io, socket);
    });

    socket.on("disconnect", (reason) => {
      const roomId = socket.data.currentRoomId;

      if (roomId) {
        void broadcastPresence(io, roomId).catch((error) => {
          console.error("Socket.IO presence update failed", error);
        });
      }

      console.log(`Socket.IO disconnected: ${user.username} (${reason})`);
    });
  });
};
