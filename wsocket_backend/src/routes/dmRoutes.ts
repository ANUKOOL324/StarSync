import { Router } from "express";

import { createDmController, getDmsController } from "../controllers/dmController";
import { requireAuth } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

export const dmRoutes = Router();

dmRoutes.use(requireAuth);
dmRoutes.get("/", asyncHandler(getDmsController));
dmRoutes.post("/", asyncHandler(createDmController));
