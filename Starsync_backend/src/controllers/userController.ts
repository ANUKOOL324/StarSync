import type { Request, Response } from "express";

import { searchUsers } from "../services/userService";
import { HttpError } from "../utils/HttpError";
import { userSearchSchema } from "../validations/userValidation";

export const searchUsersController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { query } = userSearchSchema.parse(request.query);
  const users = await searchUsers(query, request.user.userId);

  response.status(200).json({ users });
};
