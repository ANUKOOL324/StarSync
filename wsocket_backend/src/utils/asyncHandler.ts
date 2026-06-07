import type { NextFunction, Request, RequestHandler, Response } from "express";

// Our controllers are async because they call Prisma, bcrypt, JWT helpers, etc.
// This type describes an async Express controller.
type AsyncController = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<void>;

export const asyncHandler = (controller: AsyncController): RequestHandler => {
  return (request: Request, response: Response, next: NextFunction) => {
    const controllerPromise = controller(request, response, next);

    // If the async controller throws an error, the promise is rejected.
    // Passing that error to next() sends it to the global error middleware.
    controllerPromise.catch((error) => {
      next(error);
    });
  };
};
