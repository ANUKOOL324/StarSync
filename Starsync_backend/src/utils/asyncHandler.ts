import type { NextFunction, Request, RequestHandler, Response } from "express";



type AsyncController = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<void>;

export const asyncHandler = (controller: AsyncController): RequestHandler => {
  return (request: Request, response: Response, next: NextFunction) => {
    const controllerPromise = controller(request, response, next);

    
    
    controllerPromise.catch((error) => {
      next(error);
    });
  };
};
