import type { Request, Response } from "express";

import { getCurrentUser, loginUser, signupUser } from "../services/authService";
import { loginSchema, signupSchema } from "../validations/authValidation";
import { HttpError } from "../utils/HttpError";

export const signup = async (request: Request, response: Response) => {
  const input = signupSchema.parse(request.body);
  const result = await signupUser(input);

  response.status(201).json(result);
};

export const login = async (request: Request, response: Response) => {
  const input = loginSchema.parse(request.body);
  const result = await loginUser(input);

  response.status(200).json(result);
};

export const me = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const user = await getCurrentUser(request.user.userId);
  response.status(200).json({ user });
};
