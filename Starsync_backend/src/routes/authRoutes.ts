import { Router } from "express";

import { login, logout, me, signup } from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

export const authRoutes = Router();

authRoutes.post("/signup", asyncHandler(signup));
authRoutes.post("/login", asyncHandler(login));
authRoutes.post("/logout", asyncHandler(logout));
authRoutes.get("/me", requireAuth, asyncHandler(me));
