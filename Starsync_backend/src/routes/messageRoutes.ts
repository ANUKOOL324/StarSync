import { Router } from "express";

import { getRoomMessagesController } from "../controllers/messageController";
import { requireAuth } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

export const messageRoutes = Router();

messageRoutes.use(requireAuth);
messageRoutes.get("/:roomId", asyncHandler(getRoomMessagesController));
