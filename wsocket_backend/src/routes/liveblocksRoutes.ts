import { Router } from "express";

import { authorizeLiveblocksRoom } from "../controllers/liveblocksController";
import { requireAuth } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

export const liveblocksRoutes = Router();

liveblocksRoutes.post("/auth", requireAuth, asyncHandler(authorizeLiveblocksRoom));
