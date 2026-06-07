import type { Request, Response } from "express";

import { getRoomMessages } from "../services/messageService";
import { HttpError } from "../utils/HttpError";
import { messageParamsSchema, messageQuerySchema } from "../validations/messageValidation";

export const getRoomMessagesController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = messageParamsSchema.parse(request.params);
  const { cursor, limit } = messageQuerySchema.parse(request.query);
  const result = await getRoomMessages(roomId, limit, request.user.userId, cursor);

  response.status(200).json(result);
};
