import type { Request, Response } from "express";

import {
  getRoomProblems,
  getRoomProblemSubmissions,
  runRoomProblemVisibleTestcases,
  submitRoomProblemCode,
} from "../services/roomProblemService";
import {
  createRoom,
  deleteRoom,
  getRoomByIdOrSlug,
  getRoomMembers,
  getRooms,
  joinRoomByCode,
  removeRoomMember,
  updateRoom,
} from "../services/roomService";
import {
  broadcastSocketIoRoomSubmissionCreated,
  broadcastSocketIoRoomTimerUpdated,
  evictAllUsersFromSocketRoom,
  evictUserFromSocketRoom,
} from "../socketio/socketIoManager";
import { resolveSocketRoomId } from "../utils/socketRoom";
import { HttpError } from "../utils/HttpError";
import {
  createRoomSchema,
  joinRoomSchema,
  roomMemberParamsSchema,
  roomParamsSchema,
  runRoomProblemCodeSchema,
  submitRoomProblemCodeSchema,
  roomProblemParamsSchema,
  updateRoomSchema,
} from "../validations/roomValidation";

export const createRoomController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const input = createRoomSchema.parse(request.body);
  const room = await createRoom(input, request.user.userId);

  response.status(201).json({ room });
};

export const getRoomsController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const rooms = await getRooms(request.user.userId);
  response.status(200).json({ rooms });
};

export const joinRoomController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const input = joinRoomSchema.parse(request.body);
  const room = await joinRoomByCode(input, request.user.userId);

  response.status(200).json({ room });
};

export const getRoomController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = roomParamsSchema.parse(request.params);
  const room = await getRoomByIdOrSlug(roomId, request.user.userId);

  response.status(200).json({ room });
};

export const getRoomMembersController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = roomParamsSchema.parse(request.params);
  const members = await getRoomMembers(roomId, request.user.userId);

  response.status(200).json({ members });
};

export const getRoomProblemsController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = roomParamsSchema.parse(request.params);
  const problems = await getRoomProblems(roomId, request.user.userId);

  response.status(200).json({ problems });
};

export const runRoomProblemCodeController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = roomParamsSchema.parse(request.params);
  const input = runRoomProblemCodeSchema.parse({
    ...request.body,
    roomId,
  });
  const result = await runRoomProblemVisibleTestcases(input, request.user.userId);

  response.status(200).json(result);
};

export const updateRoomController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = roomParamsSchema.parse(request.params);
  const input = updateRoomSchema.parse(request.body);
  const room = await updateRoom(roomId, input, request.user.userId);

  if (input.sessionStatus || input.sessionStartedAt !== undefined) {
    const timerPayload = {
      roomId: room.id,
      sessionStatus: room.sessionStatus,
      sessionStartedAt: room.sessionStartedAt,
      durationMinutes: room.durationMinutes,
    };

    broadcastSocketIoRoomTimerUpdated(room.id, timerPayload);
  }

  response.status(200).json({ room });
};

export const deleteRoomController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = roomParamsSchema.parse(request.params);
  const deletedRoom = await deleteRoom(roomId, request.user.userId);
  await evictAllUsersFromSocketRoom(deletedRoom.id);

  response.status(204).send();
};

export const removeRoomMemberController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId, userId } = roomMemberParamsSchema.parse(request.params);
  const removedMember = await removeRoomMember(roomId, userId, request.user.userId);
  await evictUserFromSocketRoom(removedMember.roomId, removedMember.userId);

  response.status(200).json({ removedMember });
};

export const submitRoomProblemCodeController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = roomParamsSchema.parse(request.params);
  const input = submitRoomProblemCodeSchema.parse({
    ...request.body,
    roomId,
  });
  const result = await submitRoomProblemCode(input, request.user.userId);
  const canonicalRoomId = await resolveSocketRoomId(roomId, request.user.userId);

  if (canonicalRoomId) {
    const submissionPayload = {
      roomId: canonicalRoomId,
      problemId: result.problemId,
      submissionId: result.submissionId,
      userId: request.user.userId,
      username: result.username,
      status: result.status,
      language: result.language,
      passedCount: result.passedCount,
      totalCount: result.totalCount,
      ...(result.runtimeMs !== undefined ? { runtimeMs: result.runtimeMs } : {}),
      submittedAt: result.submittedAt,
    };

    broadcastSocketIoRoomSubmissionCreated(canonicalRoomId, submissionPayload);
  }

  response.status(200).json(result);
};

export const getRoomProblemSubmissionsController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId, problemId } = roomProblemParamsSchema.parse(request.params);
  const submissions = await getRoomProblemSubmissions(roomId, problemId, request.user.userId);

  response.status(200).json({ submissions });
};
