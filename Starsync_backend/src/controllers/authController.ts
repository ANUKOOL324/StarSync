import type { Request, Response } from "express";

import {
  clearSessionCookieOptions,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "../config/session";
import { getCurrentUser, loginUser, signupUser } from "../services/authService";
import { createSession, destroySession } from "../services/sessionService";
import { loginSchema, signupSchema } from "../validations/authValidation";
import { HttpError } from "../utils/HttpError";

const setSessionCookie = (response: Response, sessionId: string) => {
  response.cookie(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions);
};

const clearSessionCookie = (response: Response) => {
  response.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions);
};

export const signup = async (request: Request, response: Response) => {
  const signupInput = signupSchema.parse(request.body);
  const signupResult = await signupUser(signupInput);
  const sessionId = await createSession(signupResult.user);

  setSessionCookie(response, sessionId);

  response.status(201).json(signupResult);
};

export const login = async (request: Request, response: Response) => {
  const loginInput = loginSchema.parse(request.body);
  const loginResult = await loginUser(loginInput);
  const sessionId = await createSession(loginResult.user);

  setSessionCookie(response, sessionId);

  response.status(200).json(loginResult);
};

export const logout = async (request: Request, response: Response) => {
  const sessionId = request.cookies?.[SESSION_COOKIE_NAME];

  if (typeof sessionId === "string" && sessionId) {
    await destroySession(sessionId);
  }

  clearSessionCookie(response);

  response.status(200).json({ message: "Logged out" });
};

export const me = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const loggedInUserId = request.user.userId;
  const currentUser = await getCurrentUser(loggedInUserId);

  response.status(200).json({ user: currentUser });
};
