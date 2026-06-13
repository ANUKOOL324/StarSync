import type { Request, Response } from "express";

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
import { HttpError } from "../utils/HttpError";
import {
  createRoomSchema,
  joinRoomSchema,
  roomMemberParamsSchema,
  roomParamsSchema,
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

export const updateRoomController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = roomParamsSchema.parse(request.params);
  const input = updateRoomSchema.parse(request.body);
  const room = await updateRoom(roomId, input, request.user.userId);

  response.status(200).json({ room });
};

export const deleteRoomController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = roomParamsSchema.parse(request.params);
  await deleteRoom(roomId, request.user.userId);

  response.status(204).send();
};

export const removeRoomMemberController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId, userId } = roomMemberParamsSchema.parse(request.params);
  const removedMember = await removeRoomMember(roomId, userId, request.user.userId);

  response.status(200).json({ removedMember });
};
