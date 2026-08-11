import { getActiveSocketIoServer } from "./socketServerState";
import type { RoomSubmissionCreatedPayload, RoomTimerUpdatedPayload } from "./socketTypes";

export const broadcastSocketIoRoomTimerUpdated = (
  roomId: string,
  payload: RoomTimerUpdatedPayload,
) => {
  const io = getActiveSocketIoServer();

  if (!io) {
    return;
  }

  io.to(roomId).emit("ROOM_TIMER_UPDATED", payload);
};

export const broadcastSocketIoRoomSubmissionCreated = (
  roomId: string,
  payload: RoomSubmissionCreatedPayload,
) => {
  const io = getActiveSocketIoServer();

  if (!io) {
    return;
  }

  io.to(roomId).emit("ROOM_SUBMISSION_CREATED", payload);
};
