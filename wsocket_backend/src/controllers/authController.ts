import type { Request, Response } from "express";

import { getCurrentUser, loginUser, signupUser } from "../services/authService";
import { loginSchema, signupSchema } from "../validations/authValidation";
import { HttpError } from "../utils/HttpError";

export const signup = async (request: Request, response: Response) => {
  
  
  const signupInput = signupSchema.parse(request.body);

  
  const signupResult = await signupUser(signupInput);

  response.status(201).json(signupResult);
};

export const login = async (request: Request, response: Response) => {
  
  const loginInput = loginSchema.parse(request.body);

  
  const loginResult = await loginUser(loginInput);

  response.status(200).json(loginResult);
};

export const me = async (request: Request, response: Response) => {
  
  
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const loggedInUserId = request.user.userId;
  const currentUser = await getCurrentUser(loggedInUserId);

  response.status(200).json({ user: currentUser });
};
