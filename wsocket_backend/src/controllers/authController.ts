import type { Request, Response } from "express";

import { getCurrentUser, loginUser, signupUser } from "../services/authService";
import { loginSchema, signupSchema } from "../validations/authValidation";
import { HttpError } from "../utils/HttpError";

export const signup = async (request: Request, response: Response) => {
  // Validate the request body before sending data to the service layer.
  // Zod will throw a validation error if username/email/password are invalid.
  const signupInput = signupSchema.parse(request.body);

  // The service handles database work, password hashing, and token creation.
  const signupResult = await signupUser(signupInput);

  response.status(201).json(signupResult);
};

export const login = async (request: Request, response: Response) => {
  // Validate login input first so the service receives clean data.
  const loginInput = loginSchema.parse(request.body);

  // The service checks the user password and returns a JWT if login is correct.
  const loginResult = await loginUser(loginInput);

  response.status(200).json(loginResult);
};

export const me = async (request: Request, response: Response) => {
  // requireAuth middleware should already attach request.user.
  // This check protects the controller if it is ever used without that middleware.
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const loggedInUserId = request.user.userId;
  const currentUser = await getCurrentUser(loggedInUserId);

  response.status(200).json({ user: currentUser });
};
