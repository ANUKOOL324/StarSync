import { Router } from "express";

import { login, logout, me, signup } from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";
import { authRateLimiter } from "../middleware/rateLimiters";
import { asyncHandler } from "../utils/asyncHandler";

export const authRoutes = Router();

authRoutes.post("/signup", authRateLimiter, asyncHandler(signup));
authRoutes.post("/login", authRateLimiter, asyncHandler(login));
authRoutes.post("/logout", asyncHandler(logout));
authRoutes.get("/me", requireAuth, asyncHandler(me));
