import type { RequestHandler } from "express";

import { SESSION_COOKIE_NAME } from "../config/session";
import { getSession } from "../services/sessionService";
import { HttpError } from "../utils/HttpError";

export const requireAuth: RequestHandler = async (request, _response, next) => {
  const sessionId = request.cookies?.[SESSION_COOKIE_NAME];

  if (typeof sessionId !== "string" || !sessionId) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }

  const session = await getSession(sessionId);

  if (!session) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }

  request.user = {
    userId: session.userId,
    username: session.username,
    email: session.email,
  };

  next();
};
