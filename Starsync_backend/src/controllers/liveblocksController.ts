import type { Request, Response } from "express";

import { authorizeLiveblocksCollaborationRoom } from "../services/liveblocksService";
import { HttpError } from "../utils/HttpError";

export const authorizeLiveblocksRoom = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const liveblocksRoomId = String(request.body.room ?? "").trim();

  if (!liveblocksRoomId) {
    throw new HttpError(400, "Liveblocks room is required");
  }

  const authResult = await authorizeLiveblocksCollaborationRoom({
    liveblocksRoomId,
    userId: request.user.userId,
  });

  response.status(200).json(authResult);
};
