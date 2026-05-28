import type { RequestHandler } from "express";

import { HttpError } from "../utils/HttpError";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, `Route not found: ${request.method} ${request.originalUrl}`));
};
