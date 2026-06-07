import type { RequestHandler } from "express";

import { HttpError } from "../utils/HttpError";
import { verifyAuthToken } from "../utils/jwt";

const BEARER_PREFIX = "Bearer ";

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith(BEARER_PREFIX)) {
    next(new HttpError(401, "Missing bearer token"));
    return;
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length);

  try {
    const verifiedTokenPayload = verifyAuthToken(token);
    request.user = verifiedTokenPayload;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
};
