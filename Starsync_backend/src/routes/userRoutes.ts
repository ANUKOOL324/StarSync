import { Router } from "express";

import { searchUsersController } from "../controllers/userController";
import { requireAuth } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

export const userRoutes = Router();

userRoutes.use(requireAuth);
userRoutes.get("/search", asyncHandler(searchUsersController));
