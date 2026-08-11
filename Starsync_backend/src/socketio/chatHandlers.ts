import { prisma } from "../prisma/client";
import { createMessage } from "../services/messageService";
import { dispatchMessageNotifications, markRoomReadForUser } from "../services/roomReadService";
import type { ChatPayload, ChatVisibilityPayload, SocketIoConnection, SocketIoServer } from "./socketTypes";
import { collectChatViewingUserIds } from "./presenceService";
import { broadcastTypingUpdate, clearTypingTimer } from "./typingHandlers";

export const handleChatVisibility = async (
  _io: SocketIoServer,
  socket: SocketIoConnection,
  payload: ChatVisibilityPayload,
) => {
  if (typeof payload?.roomId !== "string" || typeof payload?.visible !== "boolean") {
    return;
  }

  const roomId = socket.data.currentRoomId;

  if (!roomId || roomId !== payload.roomId) {
    return;
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { type: true },
  });

  if (!room) {
    return;
  }

  if (room.type === "DM") {
    socket.data.chatVisible = true;

    if (payload.visible) {
      await markRoomReadForUser(roomId, socket.data.user.id);
    }

    return;
  }

  socket.data.chatVisible = payload.visible;

  if (payload.visible) {
    await markRoomReadForUser(roomId, socket.data.user.id);
  }
};

export const handleChat = async (io: SocketIoServer, socket: SocketIoConnection, payload: ChatPayload) => {
  const messageContent = typeof payload?.message === "string" ? payload.message.trim() : "";
  const clientMessageId = payload?.clientMessageId;
  const roomId = socket.data.currentRoomId;

  if (!roomId || !messageContent) {
    socket.emit("message-error", {
      ...(clientMessageId ? { clientMessageId } : {}),
      message: "Join a room before sending messages",
    });
    return;
  }

  clearTypingTimer(socket.id);
  await broadcastTypingUpdate(io, roomId, socket.data.user, false);

  try {
    const savedMessage = await createMessage({
      content: messageContent,
      roomId,
      senderId: socket.data.user.id,
    });

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { type: true },
    });

    if (room) {
      const viewingUserIds = await collectChatViewingUserIds(io, roomId, room.type);

      await dispatchMessageNotifications({
        io,
        roomId,
        roomType: room.type,
        savedMessage,
        senderId: socket.data.user.id,
        viewingUserIds,
      });
    }

    io.to(roomId).emit("message", {
      id: savedMessage.id,
      ...(clientMessageId ? { clientMessageId } : {}),
      mess: savedMessage.content,
      content: savedMessage.content,
      createdAt: savedMessage.createdAt,
      senderId: savedMessage.senderId,
      roomId: savedMessage.roomId,
      sender: savedMessage.sender,
    });
  } catch (error) {
    console.error("Socket.IO message persistence failed", error);
    socket.emit("message-error", {
      ...(clientMessageId ? { clientMessageId } : {}),
      message: "Message could not be saved",
    });
  }
};
