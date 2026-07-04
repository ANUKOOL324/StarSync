import type { Request, Response } from "express";

import { createOrGetDmRoom, getDmRoomsForUser } from "../services/dmService";
import { HttpError } from "../utils/HttpError";
import { createDmSchema } from "../validations/dmValidation";

export const createDmController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const input = createDmSchema.parse(request.body);
  const room = await createOrGetDmRoom(request.user.userId, input.userId, input.sourceRoomId);

  response.status(201).json({ room });
};

export const getDmsController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const rooms = await getDmRoomsForUser(request.user.userId);
  response.status(200).json({ rooms });
};
