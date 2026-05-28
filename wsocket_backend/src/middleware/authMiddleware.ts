import type { RequestHandler } from "express";

import { HttpError } from "../utils/HttpError";
import { verifyAuthToken } from "../utils/jwt";

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(new HttpError(401, "Missing bearer token"));
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    request.user = verifyAuthToken(token);
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
};
